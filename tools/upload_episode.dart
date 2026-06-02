import 'dart:convert';
import 'dart:io';

Future<void> main(List<String> args) async {
  if (args.length < 4) {
    _usage();
    exitCode = 64;
    return;
  }

  final seriesId = args[0];
  final order = int.tryParse(args[1]);
  if (order == null || order < 1) {
    stderr.writeln('Episode order must be a positive integer.');
    exitCode = 64;
    return;
  }

  final videoFile = File(args[2]);
  final thumbFile = File(args[3]);
  final isVip = args.length > 4 && args[4] == 'true';

  if (!videoFile.existsSync()) {
    stderr.writeln('Video file not found: ${videoFile.path}');
    exitCode = 66;
    return;
  }
  if (!thumbFile.existsSync()) {
    stderr.writeln('Thumbnail file not found: ${thumbFile.path}');
    exitCode = 66;
    return;
  }

  final projectId =
      Platform.environment['FIREBASE_PROJECT_ID'] ?? 'shortigo-prod';
  final envBucket = Platform.environment['FIREBASE_STORAGE_BUCKET'];
  final token = await _accessToken();
  final client = HttpClient();
  final bucket = envBucket ??
      await _resolveExistingBucket(
        client: client,
        token: token,
        candidates: [
          '$projectId.firebasestorage.app',
          '$projectId.appspot.com',
        ],
      );

  final episodeId = '${seriesId}_e$order';
  final videoObject = 'series/$seriesId/episodes/$episodeId.mp4';
  final thumbObject = 'series/$seriesId/thumbnails/$episodeId.jpg';

  try {
    stdout.writeln('Uploading video to gs://$bucket/$videoObject...');
    final videoUrl = await _uploadObject(
      client: client,
      token: token,
      bucket: bucket,
      objectName: videoObject,
      file: videoFile,
      contentType: 'video/mp4',
    );

    stdout.writeln('Uploading thumbnail to gs://$bucket/$thumbObject...');
    final thumbUrl = await _uploadObject(
      client: client,
      token: token,
      bucket: bucket,
      objectName: thumbObject,
      file: thumbFile,
      contentType: 'image/jpeg',
    );

    await _writeEpisode(
      client: client,
      token: token,
      projectId: projectId,
      episodeId: episodeId,
      fields: {
        'id': episodeId,
        'seriesId': seriesId,
        'order': order,
        'videoUrl': videoUrl,
        'thumbnailUrl': thumbUrl,
        'durationSec': 60,
        'isVipLocked': isVip,
      },
    );
  } finally {
    client.close(force: true);
  }

  stdout.writeln('Episode $order uploaded to series $seriesId.');
}

Future<String> _resolveExistingBucket({
  required HttpClient client,
  required String token,
  required List<String> candidates,
}) async {
  for (final bucket in candidates) {
    if (await _bucketExists(client: client, token: token, bucket: bucket)) {
      return bucket;
    }
  }

  throw StateError(
    'Could not resolve a valid storage bucket. Set FIREBASE_STORAGE_BUCKET.',
  );
}

Future<bool> _bucketExists({
  required HttpClient client,
  required String token,
  required String bucket,
}) async {
  final uri = Uri.https('storage.googleapis.com', '/storage/v1/b/$bucket');
  final request = await client.getUrl(uri);
  request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');
  final response = await request.close();
  await response.drain<void>();
  return response.statusCode == HttpStatus.ok;
}

void _usage() {
  stderr.writeln(
    'Usage: dart run tools/upload_episode.dart '
    '<seriesId> <order> <videoPath> <thumbPath> [isVip]',
  );
}

Future<String> _accessToken() async {
  final envToken = Platform.environment['FIREBASE_ACCESS_TOKEN'];
  if (envToken != null && envToken.isNotEmpty) {
    return envToken;
  }

  final result = await Process.run('gcloud', ['auth', 'print-access-token']);
  if (result.exitCode != 0) {
    stderr.writeln(result.stderr);
    throw StateError(
      'Unable to get a gcloud access token. Set FIREBASE_ACCESS_TOKEN instead.',
    );
  }

  return (result.stdout as String).trim();
}

Future<String> _uploadObject({
  required HttpClient client,
  required String token,
  required String bucket,
  required String objectName,
  required File file,
  required String contentType,
}) async {
  final uri = Uri.https(
    'storage.googleapis.com',
    '/upload/storage/v1/b/$bucket/o',
    {
      'uploadType': 'media',
      'name': objectName,
    },
  );
  final request = await client.postUrl(uri);
  request.headers
    ..contentType = ContentType.parse(contentType)
    ..set(HttpHeaders.authorizationHeader, 'Bearer $token')
    ..set(HttpHeaders.cacheControlHeader, 'public, max-age=86400');
  request.add(await file.readAsBytes());

  final response = await request.close();
  final body = await response.transform(utf8.decoder).join();
  if (response.statusCode != HttpStatus.ok) {
    throw HttpException(
      'Storage upload failed for $objectName (${response.statusCode}): $body',
      uri: uri,
    );
  }

  final object = jsonDecode(body) as Map<String, Object?>;
  return object['mediaLink'] as String? ??
      'https://storage.googleapis.com/$bucket/${Uri.encodeComponent(objectName)}';
}

Future<void> _writeEpisode({
  required HttpClient client,
  required String token,
  required String projectId,
  required String episodeId,
  required Map<String, Object?> fields,
}) async {
  final uri = Uri.https(
    'firestore.googleapis.com',
    '/v1/projects/$projectId/databases/(default)/documents/episodes/$episodeId',
  );
  final request = await client.patchUrl(uri);
  request.headers
    ..contentType = ContentType.json
    ..set(HttpHeaders.authorizationHeader, 'Bearer $token');
  request.write(jsonEncode({'fields': _encodeFields(fields)}));

  final response = await request.close();
  final body = await response.transform(utf8.decoder).join();
  if (response.statusCode != HttpStatus.ok) {
    throw HttpException(
      'Firestore write failed for episodes/$episodeId '
      '(${response.statusCode}): $body',
      uri: uri,
    );
  }
}

Map<String, Object?> _encodeFields(Map<String, Object?> fields) {
  return fields.map((key, value) => MapEntry(key, _encodeValue(value)));
}

Map<String, Object?> _encodeValue(Object? value) {
  if (value == null) {
    return {'nullValue': null};
  }
  if (value is String) {
    return {'stringValue': value};
  }
  if (value is int) {
    return {'integerValue': value.toString()};
  }
  if (value is bool) {
    return {'booleanValue': value};
  }

  throw ArgumentError.value(value, 'value', 'Unsupported Firestore value');
}
