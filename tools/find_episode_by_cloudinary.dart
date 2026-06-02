import 'dart:convert';
import 'dart:io';

/// Scans Firestore `episodes` for a Cloudinary public_id fragment.
///
/// Usage:
///   dart run tools/find_episode_by_cloudinary.dart t7qrn4uiwfwkc3kyzisr
Future<void> main(List<String> args) async {
  final needle = args.isNotEmpty
      ? args.first
      : 't7qrn4uiwfwkc3kyzisr';
  final projectId =
      Platform.environment['FIREBASE_PROJECT_ID'] ?? 'shortigo-prod';
  final token = await _accessToken();

  final uri = Uri.parse(
    'https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents/episodes',
  );
  final client = HttpClient();
  try {
    final request = await client.getUrl(uri);
    request.headers.set('Authorization', 'Bearer $token');
    final response = await request.close();
    final body = await response.transform(utf8.decoder).join();
    if (response.statusCode != 200) {
      stderr.writeln('Firestore list failed (${response.statusCode}): $body');
      exitCode = 1;
      return;
    }

    final decoded = jsonDecode(body) as Map<String, dynamic>;
    final documents = decoded['documents'] as List<dynamic>? ?? [];
    var hits = 0;
    for (final raw in documents) {
      final doc = raw as Map<String, dynamic>;
      final name = doc['name'] as String? ?? '';
      final id = name.split('/').last;
      final fields = doc['fields'] as Map<String, dynamic>? ?? {};
      final videoUrl = _stringField(fields, 'videoUrl') ?? '';
      if (!videoUrl.contains(needle)) {
        continue;
      }
      hits += 1;
      final seriesId = _stringField(fields, 'seriesId') ?? '?';
      final order = _intField(fields, 'order') ?? 0;
      stdout.writeln('—');
      stdout.writeln('episode doc: $id');
      stdout.writeln('seriesId:    $seriesId');
      stdout.writeln('app label:   EP.$order');
      stdout.writeln('videoUrl:    $videoUrl');
    }

    if (hits == 0) {
      stdout.writeln(
        'No episode documents contain "$needle" in videoUrl.\n'
        'The video may only exist on Cloudinary — publish from the CRM '
        '(Upload + Publish episode) with adminUsers/{uid} set.',
      );
    } else {
      stdout.writeln('\nFound $hits episode(s). Open that series in the app.');
    }
  } finally {
    client.close(force: true);
  }
}

String? _stringField(Map<String, dynamic> fields, String key) {
  final value = fields[key];
  if (value is! Map<String, dynamic>) {
    return null;
  }
  return value['stringValue'] as String?;
}

int? _intField(Map<String, dynamic> fields, String key) {
  final value = fields[key];
  if (value is! Map<String, dynamic>) {
    return null;
  }
  final raw = value['integerValue'] ?? value['doubleValue'];
  if (raw == null) {
    return null;
  }
  return int.tryParse(raw.toString());
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
