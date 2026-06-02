import 'dart:convert';
import 'dart:io';

/// Renames series titles. Pass `id=New Title` pairs.
///
/// Usage:
///   dart run tools/rename_series.dart "test2=Good Action" "test3=Good Action 2"
Future<void> main(List<String> args) async {
  if (args.isEmpty) {
    stderr.writeln('Pass at least one "seriesId=New Title" pair.');
    exitCode = 2;
    return;
  }
  final projectId =
      Platform.environment['FIREBASE_PROJECT_ID'] ?? 'shortigo-prod';
  final token = await _accessToken();
  final client = HttpClient();
  try {
    for (final arg in args) {
      final idx = arg.indexOf('=');
      if (idx <= 0) {
        stderr.writeln('Skipping "$arg": expected seriesId=New Title.');
        continue;
      }
      final id = arg.substring(0, idx).trim();
      final title = arg.substring(idx + 1).trim();
      await _patchTitle(client, token, projectId, id, title);
      stdout.writeln('Renamed series "$id" -> "$title".');
    }
    stdout.writeln('\nDone. Pull to refresh in the app to see new titles.');
  } finally {
    client.close(force: true);
  }
}

Future<void> _patchTitle(
  HttpClient client,
  String token,
  String projectId,
  String id,
  String title,
) async {
  final uri = Uri.parse(
    'https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents/series/$id'
    '?updateMask.fieldPaths=title',
  );
  final body = jsonEncode({
    'fields': {
      'title': {'stringValue': title},
    },
  });
  final req = await client.patchUrl(uri);
  req.headers.set('Authorization', 'Bearer $token');
  req.headers.contentType = ContentType.json;
  req.write(body);
  final res = await req.close();
  final text = await res.transform(utf8.decoder).join();
  if (res.statusCode != 200) {
    throw StateError('Rename $id failed (${res.statusCode}): $text');
  }
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
