import 'dart:convert';
import 'dart:io';

/// Audits Firestore for orphan episodes and prints series + episode mapping.
///
/// Usage:
///   dart run tools/audit_firestore.dart
Future<void> main() async {
  final projectId =
      Platform.environment['FIREBASE_PROJECT_ID'] ?? 'shortigo-prod';
  final token = await _accessToken();
  final client = HttpClient();

  try {
    final series = await _listCollection(client, token, projectId, 'series');
    final episodes =
        await _listCollection(client, token, projectId, 'episodes');

    final seriesIds = <String>{};
    stdout.writeln('=== SERIES (${series.length}) ===');
    for (final doc in series) {
      final id = doc.id;
      seriesIds.add(id);
      final title = _string(doc.fields, 'title') ?? '(no title)';
      final category = _string(doc.fields, 'category') ?? '(no category)';
      final count = _int(doc.fields, 'episodeCount');
      final published = _bool(doc.fields, 'isPublished');
      stdout.writeln(
        '$id | "$title" | category=$category | episodeCount=$count | isPublished=$published',
      );
    }

    stdout.writeln('\n=== EPISODES (${episodes.length}) ===');
    final orphans = <_Doc>[];
    final bySeries = <String, int>{};
    for (final doc in episodes) {
      final seriesId = _string(doc.fields, 'seriesId') ?? '';
      bySeries[seriesId] = (bySeries[seriesId] ?? 0) + 1;
      final order = _int(doc.fields, 'order');
      final video = _string(doc.fields, 'videoUrl') ?? '';
      final isOrphan = !seriesIds.contains(seriesId);
      if (isOrphan) {
        orphans.add(doc);
      }
      stdout.writeln(
        '${doc.id} | seriesId=$seriesId${isOrphan ? "  <-- ORPHAN" : ""} | order=$order | video=${_short(video)}',
      );
    }

    stdout.writeln('\n=== ORPHAN EPISODES (${orphans.length}) ===');
    if (orphans.isEmpty) {
      stdout.writeln('None. Every episode points to an existing series.');
    } else {
      for (final doc in orphans) {
        final seriesId = _string(doc.fields, 'seriesId') ?? '';
        stdout.writeln(
          '${doc.id} -> missing series "$seriesId" (app will NOT show it).',
        );
      }
    }

    stdout.writeln('\n=== EPISODE COUNT PER seriesId ===');
    bySeries.forEach((sid, n) {
      final exists = seriesIds.contains(sid);
      stdout.writeln('$sid: $n episode(s)${exists ? "" : "  (series MISSING)"}');
    });
  } finally {
    client.close(force: true);
  }
}

class _Doc {
  _Doc(this.id, this.fields);
  final String id;
  final Map<String, dynamic> fields;
}

Future<List<_Doc>> _listCollection(
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

bool? _bool(Map<String, dynamic> f, String k) =>
    (f[k] as Map<String, dynamic>?)?['booleanValue'] as bool?;

String _short(String url) =>
    url.length <= 60 ? url : '${url.substring(0, 57)}...';

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
