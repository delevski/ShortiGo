import 'dart:convert';
import 'dart:io';

import 'package:firebase_auth/firebase_auth.dart';

import '../../domain/interfaces/reward_gateway.dart';

class RewardApiGateway implements RewardGateway {
  RewardApiGateway({
    required FirebaseAuth auth,
    required String baseUrl,
    HttpClient Function()? clientFactory,
  })  : _auth = auth,
        _baseUrl = baseUrl,
        _clientFactory = clientFactory ?? HttpClient.new;

  final FirebaseAuth _auth;
  final String _baseUrl;
  final HttpClient Function() _clientFactory;

  @override
  Future<void> unlockEpisode(String episodeId) async {
    final user = _auth.currentUser;
    if (user == null) {
      throw StateError('Sign in to unlock this episode.');
    }
    if (_baseUrl.isEmpty) {
      throw StateError('Episode unlocks are not available yet.');
    }

    final token = await user.getIdToken();
    final client = _clientFactory();
    try {
      final request = await client.postUrl(
        Uri.parse('$_baseUrl/v1/episodes/$episodeId/unlock'),
      );
      request.headers.contentType = ContentType.json;
      request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');
      request.write('{}');
      final response = await request.close();
      final body = await utf8.decoder.bind(response).join();
      if (response.statusCode < 200 || response.statusCode >= 300) {
        final decoded = body.isEmpty ? null : jsonDecode(body);
        final message = decoded is Map<String, dynamic>
            ? decoded['error']?.toString()
            : null;
        throw StateError(message ?? 'Could not unlock this episode.');
      }
    } finally {
      client.close();
    }
  }
}
