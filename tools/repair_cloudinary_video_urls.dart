import 'dart:convert';
import 'dart:io';

/// Rewrites broken Cloudinary video URLs in Firestore (invalid g_auto bundle).
///
/// Usage:
///   dart run tools/repair_cloudinary_video_urls.dart
///   dart run tools/repair_cloudinary_video_urls.dart --dry-run
Future<void> main(List<String> args) async {
  final dryRun = args.contains('--dry-run');
  const videoTransforms = 'c_fill,ar_9:16,q_auto';
  final projectId =
      Platform.environment['FIREBASE_PROJECT_ID'] ?? 'shortigo-prod';
  final token = await _accessToken();
  final client = HttpClient();

  try {
    final episodes = await _listDocs(client, token, projectId, 'episodes');
    var repaired = 0;

    for (final doc in episodes) {
      final videoUrl = _string(doc.fields, 'videoUrl') ?? '';
      if (!videoUrl.contains('res.cloudinary.com')) {
        continue;
      }
      if (!videoUrl.contains('g_auto,q_auto') &&
          !videoUrl.contains('g_auto,f_mp4') &&
          !videoUrl.contains(',f_mp4/')) {
        continue;
      }

      final fixed = _repairUrl(videoUrl, videoTransforms);
      if (fixed == videoUrl) {
        continue;
      }

      stdout.writeln('${doc.id}:');
      stdout.writeln('  was: $videoUrl');
      stdout.writeln('  now: $fixed');

      if (!dryRun) {
        await _patchVideoUrl(client, token, projectId, doc.id, fixed);
      }
      repaired += 1;
    }

    stdout.writeln(
      dryRun
          ? '\nDry run: $repaired episode(s) would be repaired.'
          : '\nRepaired $repaired episode(s). Pull to refresh in the app.',
    );
  } finally {
    client.close(force: true);
  }
}

String _repairUrl(String url, String transforms) {
  final uri = Uri.parse(url);
  final path = uri.path;
  final cloudMatch = RegExp(r'res\.cloudinary\.com/([^/]+)').firstMatch(url);
  final cloudName = cloudMatch?.group(1) ?? 'dovv8qvyz';
  final versionMatch = RegExp(r'/(v\d+)/').firstMatch(path);
  final versionPrefix = versionMatch != null ? '${versionMatch.group(1)}/' : '';

  final segments = path.split('/').where((s) => s.isNotEmpty).toList();
  final uploadIdx = segments.indexOf('upload');
  if (uploadIdx == -1) {
    return url;
  }
  var start = uploadIdx + 1;
  while (start < segments.length) {
    final part = segments[start];
    if (part.contains(',') || RegExp(r'^v\d+$').hasMatch(part)) {
      start += 1;
      continue;
    }
    break;
  }
  var publicId = segments.sublist(start).join('/');
  publicId = publicId.replaceAll(RegExp(r'\.(mp4|mov|webm)$', caseSensitive: false), '');
  return 'https://res.cloudinary.com/$cloudName/video/upload/$transforms/$versionPrefix$publicId.mp4';
}

Future<void> _patchVideoUrl(
  HttpClient client,
  String token,
  String projectId,
  String episodeId,
  String videoUrl,
) async {
  final uri = Uri.parse(
    'https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents/episodes/$episodeId'
    '?updateMask.fieldPaths=videoUrl',
  );
  final body = jsonEncode({
    'fields': {
      'videoUrl': {'stringValue': videoUrl},
    },
  });
  final req = await client.patchUrl(uri);
  req.headers.set('Authorization', 'Bearer $token');
  req.headers.contentType = ContentType.json;
  req.write(body);
  final res = await req.close();
  final text = await res.transform(utf8.decoder).join();
  if (res.statusCode != 200) {
    throw StateError('Patch $episodeId failed (${res.statusCode}): $text');
  }
}

class _Doc {
  _Doc(this.id, this.fields);
  final String id;
  final Map<String, dynamic> fields;
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
      throw StateError('List failed: $body');
    }
    final decoded = jsonDecode(body) as Map<String, dynamic>;
    for (final raw in decoded['documents'] as List<dynamic>? ?? []) {
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

Future<String> _accessToken() async {
  final result = await Process.run('gcloud', [
    'auth',
    'application-default',
    'print-access-token',
  ]);
  if (result.exitCode != 0) {
    throw StateError('gcloud auth application-default login required.');
  }
  return (result.stdout as String).trim();
}
