import 'dart:convert';
import 'dart:io';

/// Repairs episodes whose `seriesId` has no matching `series/{id}` document.
///
/// Modes:
///   dart run tools/repair_orphan_episodes.dart                 # dry run (list only)
///   dart run tools/repair_orphan_episodes.dart --create-series # create placeholder series
///   dart run tools/repair_orphan_episodes.dart --delete        # delete orphan episodes
Future<void> main(List<String> args) async {
  final createSeries = args.contains('--create-series');
  final delete = args.contains('--delete');
  if (createSeries && delete) {
    stderr.writeln('Choose only one of --create-series or --delete.');
    exitCode = 2;
    return;
  }

  final projectId =
      Platform.environment['FIREBASE_PROJECT_ID'] ?? 'shortigo-prod';
  final token = await _accessToken();
  final client = HttpClient();

  try {
    final seriesIds = (await _listIds(client, token, projectId, 'series'))
        .toSet();
    final episodes = await _listDocs(client, token, projectId, 'episodes');

    final orphans = episodes.where((e) {
      final sid = _string(e.fields, 'seriesId') ?? '';
      return !seriesIds.contains(sid);
    }).toList();

    if (orphans.isEmpty) {
      stdout.writeln('No orphan episodes. Nothing to repair.');
      return;
    }

    stdout.writeln('Found ${orphans.length} orphan episode(s):');
    for (final e in orphans) {
      stdout.writeln('  ${e.id} -> seriesId="${_string(e.fields, 'seriesId')}"');
    }

    if (!createSeries && !delete) {
      stdout.writeln(
        '\nDry run. Re-run with --create-series (recommended) or --delete.',
      );
      return;
    }

    for (final e in orphans) {
      final seriesId = _string(e.fields, 'seriesId') ?? '';
      if (seriesId.isEmpty) {
        stdout.writeln('Skipping ${e.id}: empty seriesId.');
        continue;
      }
      if (createSeries) {
        await _createSeries(client, token, projectId, seriesId, e);
        stdout.writeln('Created series "$seriesId" for ${e.id}.');
      } else {
        await _deleteDoc(client, token, projectId, 'episodes', e.id);
        stdout.writeln('Deleted orphan episode ${e.id}.');
      }
    }

    stdout.writeln('\nDone. Re-run tools/audit_firestore.dart to verify.');
  } finally {
    client.close(force: true);
  }
}

Future<void> _createSeries(
  HttpClient client,
  String token,
  String projectId,
  String seriesId,
  _Doc episode,
) async {
  final thumb = _string(episode.fields, 'thumbnailUrl') ?? '';
  final uri = Uri.parse(
    'https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents/series?documentId=$seriesId',
  );
  final body = jsonEncode({
    'fields': {
      'id': {'stringValue': seriesId},
      'title': {'stringValue': seriesId},
      'description': {'stringValue': ''},
      'coverUrl': {'stringValue': thumb},
      'category': {'stringValue': 'new'},
      'isVip': {'booleanValue': false},
      'episodeCount': {'integerValue': '1'},
      'totalDurationSec': {
        'integerValue': (_int(episode.fields, 'durationSec') ?? 0).toString(),
      },
      'popularity': {'integerValue': '0'},
      'isPublished': {'booleanValue': true},
      'createdAt': {'timestampValue': DateTime.now().toUtc().toIso8601String()},
    },
  });
  final req = await client.postUrl(uri);
  req.headers.set('Authorization', 'Bearer $token');
  req.headers.contentType = ContentType.json;
  req.write(body);
  final res = await req.close();
  final text = await res.transform(utf8.decoder).join();
  if (res.statusCode != 200) {
    throw StateError('Create series $seriesId failed (${res.statusCode}): $text');
  }
}

Future<void> _deleteDoc(
  HttpClient client,
  String token,
  String projectId,
  String collection,
  String id,
) async {
  final uri = Uri.parse(
    'https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents/$collection/$id',
  );
  final req = await client.deleteUrl(uri);
  req.headers.set('Authorization', 'Bearer $token');
  final res = await req.close();
  await res.drain<void>();
  if (res.statusCode != 200) {
    throw StateError('Delete $collection/$id failed (${res.statusCode}).');
  }
}

class _Doc {
  _Doc(this.id, this.fields);
  final String id;
  final Map<String, dynamic> fields;
}

Future<List<String>> _listIds(
  HttpClient client,
  String token,
  String projectId,
  String collection,
) async {
  final docs = await _listDocs(client, token, projectId, collection);
  return docs.map((d) => d.id).toList();
}

Future<List<_Doc>> _listDocs(
  HttpClient client,
  String token,
  String projectId,
  String collection,
) async {
  final docs = <_Doc>[];
  String? pageToken;
  do {
    final params = <String, String>{'pageSize': '300'};
    if (pageToken != null) {
      params['pageToken'] = pageToken;
    }
    final uri = Uri.parse(
      'https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents/$collection',
    ).replace(queryParameters: params);
    final req = await client.getUrl(uri);
    req.headers.set('Authorization', 'Bearer $token');
    final res = await req.close();
    final body = await res.transform(utf8.decoder).join();
    if (res.statusCode != 200) {
      throw StateError('List $collection failed (${res.statusCode}): $body');
    }
    final decoded = jsonDecode(body) as Map<String, dynamic>;
    final list = decoded['documents'] as List<dynamic>? ?? [];
    for (final raw in list) {
      final doc = raw as Map<String, dynamic>;
      final id = (doc['name'] as String).split('/').last;
      docs.add(_Doc(id, doc['fields'] as Map<String, dynamic>? ?? {}));
    }
    pageToken = decoded['nextPageToken'] as String?;
  } while (pageToken != null);
  return docs;
}

String? _string(Map<String, dynamic> f, String k) =>
    (f[k] as Map<String, dynamic>?)?['stringValue'] as String?;

int? _int(Map<String, dynamic> f, String k) {
  final v = f[k] as Map<String, dynamic>?;
  final raw = v?['integerValue'] ?? v?['doubleValue'];
  return raw == null ? null : int.tryParse(raw.toString());
}

Future<String> _accessToken() async {
  final result = await Process.run('gcloud', [
    'auth',
    'application-default',
    'print-access-token',
  ]);
  if (result.exitCode != 0) {
    throw StateError(
      'gcloud auth application-default login required.\n${result.stderr}',
    );
  }
  return (result.stdout as String).trim();
}
