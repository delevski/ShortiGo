import 'dart:convert';
import 'dart:io';

/// Adds series IDs to admin/featured.seriesIds (For You tab).
///
/// Usage:
///   dart run tools/patch_featured.dart test2 test3
Future<void> main(List<String> args) async {
  if (args.isEmpty) {
    stderr.writeln('Pass one or more series IDs to add to For You.');
    exitCode = 2;
    return;
  }
  final projectId =
      Platform.environment['FIREBASE_PROJECT_ID'] ?? 'shortigo-prod';
  final token = await _accessToken();
  final client = HttpClient();
  try {
    final existing = await _getFeatured(client, token, projectId);
    final merged = {...existing, ...args}.toList()..sort();
    await _setFeatured(client, token, projectId, merged);
    stdout.writeln('admin/featured.seriesIds now includes:');
    for (final id in merged) {
      stdout.writeln('  - $id');
    }
  } finally {
    client.close(force: true);
  }
}

Future<List<String>> _getFeatured(
  HttpClient client,
  String token,
  String projectId,
) async {
  final uri = Uri.parse(
    'https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents/admin/featured',
  );
  final req = await client.getUrl(uri);
  req.headers.set('Authorization', 'Bearer $token');
  final res = await req.close();
  final body = await res.transform(utf8.decoder).join();
  if (res.statusCode == 404) {
    return [];
  }
  if (res.statusCode != 200) {
    throw StateError('Get featured failed (${res.statusCode}): $body');
  }
  final decoded = jsonDecode(body) as Map<String, dynamic>;
  final fields = decoded['fields'] as Map<String, dynamic>? ?? {};
  final arr = fields['seriesIds'] as Map<String, dynamic>?;
  final arrayValue = arr?['arrayValue'] as Map<String, dynamic>?;
  final values = arrayValue?['values'] as List<dynamic>? ?? [];
  return [
    for (final v in values)
      if (v is Map<String, dynamic>) v['stringValue'] as String? ?? '',
  ].where((s) => s.isNotEmpty).toList();
}

Future<void> _setFeatured(
  HttpClient client,
  String token,
  String projectId,
  List<String> seriesIds,
) async {
  final uri = Uri.parse(
    'https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents/admin/featured',
  );
  final body = jsonEncode({
    'fields': {
      'seriesIds': {
        'arrayValue': {
          'values': [
            for (final id in seriesIds) {'stringValue': id},
          ],
        },
      },
      'updatedAt': {
        'timestampValue': DateTime.now().toUtc().toIso8601String(),
      },
    },
  });
  final req = await client.patchUrl(uri);
  req.headers.set('Authorization', 'Bearer $token');
  req.headers.contentType = ContentType.json;
  req.write(body);
  final res = await req.close();
  final text = await res.transform(utf8.decoder).join();
  if (res.statusCode != 200) {
    // try create
    final post = await client.postUrl(
      Uri.parse(
        'https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents/admin?documentId=featured',
      ),
    );
    post.headers.set('Authorization', 'Bearer $token');
    post.headers.contentType = ContentType.json;
    post.write(body);
    final postRes = await post.close();
    final postText = await postRes.transform(utf8.decoder).join();
    if (postRes.statusCode != 200) {
      throw StateError('Set featured failed: $text / $postText');
    }
  }
}

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
