import 'dart:convert';
import 'dart:io';

Future<void> main() async {
  final projectId =
      Platform.environment['FIREBASE_PROJECT_ID'] ?? 'shortigo-prod';
  final token = await _accessToken();

  final client = HttpClient();
  try {
    final categories = ['adventure', 'scary', 'anime', 'vip', 'hot'];

    for (var i = 0; i < 5; i++) {
      final id = 's_seed_$i';
      final category = categories[i % categories.length];

      await _writeDocument(
        client: client,
        token: token,
        projectId: projectId,
        collection: 'series',
        documentId: id,
        fields: {
          'title': 'Sample Show $i',
          'description': 'A sample $category series for dev testing.',
          'coverUrl': 'https://picsum.photos/seed/$id/600/1067',
          'category': category,
          'isVip': category == 'vip',
          'episodeCount': 10,
          'totalDurationSec': 600,
          'createdAt': DateTime.now().toUtc(),
          'popularity': 100 - i,
          'isPublished': true,
        },
      );

      for (var j = 1; j <= 10; j++) {
        await _writeDocument(
          client: client,
          token: token,
          projectId: projectId,
          collection: 'episodes',
          documentId: '${id}_e$j',
          fields: {
            'seriesId': id,
            'order': j,
            'videoUrl':
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/'
                    'sample/BigBuckBunny.mp4',
            'thumbnailUrl': 'https://picsum.photos/seed/${id}_$j/600/1067',
            'durationSec': 60,
            'isVipLocked': category == 'vip',
          },
        );
      }
    }

    await _writeDocument(
      client: client,
      token: token,
      projectId: projectId,
      collection: 'admin',
      documentId: 'featured',
      fields: {
        'seriesIds': [
          's_seed_0',
          's_seed_1',
          's_seed_2',
          's_seed_3',
          's_seed_4',
        ],
        'updatedAt': DateTime.now().toUtc(),
      },
    );
  } finally {
    client.close(force: true);
  }

  stdout.writeln('Seed complete.');
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

Future<void> _writeDocument({
  required HttpClient client,
  required String token,
  required String projectId,
  required String collection,
  required String documentId,
  required Map<String, Object?> fields,
}) async {
  final uri = Uri.https(
    'firestore.googleapis.com',
    '/v1/projects/$projectId/databases/(default)/documents/$collection/$documentId',
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
      'Firestore write failed for $collection/$documentId '
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
  if (value is DateTime) {
    return {'timestampValue': value.toUtc().toIso8601String()};
  }
  if (value is List<String>) {
    return {
      'arrayValue': {
        'values': value.map(_encodeValue).toList(),
      },
    };
  }

  throw ArgumentError.value(value, 'value', 'Unsupported Firestore seed value');
}
