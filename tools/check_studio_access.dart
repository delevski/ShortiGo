// ignore_for_file: avoid_print

// Quick check: adminUsers/{uid} shape vs Firestore rules expectations.
// Usage: dart run tools/check_studio_access.dart <firebase_uid>
import 'dart:convert';
import 'dart:io';

Future<void> main(List<String> args) async {
  if (args.isEmpty) {
    stderr.writeln('Usage: dart run tools/check_studio_access.dart <uid>');
    exit(1);
  }
  final uid = args.first.trim();
  final projectId = Platform.environment['FIREBASE_PROJECT_ID'] ?? 'shortigo-prod';
  final token = Platform.environment['FIREBASE_ACCESS_TOKEN'];
  if (token == null || token.isEmpty) {
    stderr.writeln('Set FIREBASE_ACCESS_TOKEN (gcloud auth print-access-token) for read.');
    exit(1);
  }
  final url =
      'https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents/adminUsers/$uid';
  final response = await HttpClient()
      .getUrl(Uri.parse(url))
      .then((r) {
        r.headers.set('Authorization', 'Bearer $token');
        return r.close();
      });
  final body = await response.transform(utf8.decoder).join();
  if (response.statusCode == 404) {
    print('MISSING: adminUsers/$uid does not exist.');
    print('Create it in Firebase Console or link via CRM Providers tab.');
    exit(2);
  }
  if (response.statusCode != 200) {
    stderr.writeln('HTTP ${response.statusCode}: $body');
    exit(3);
  }
  final json = jsonDecode(body) as Map<String, dynamic>;
  final fields = json['fields'] as Map<String, dynamic>? ?? {};
  String? stringVal(String key) {
    final f = fields[key];
    if (f is Map && f['stringValue'] is String) {
      return f['stringValue'] as String;
    }
    return null;
  }
  bool? boolVal(String key) {
    final f = fields[key];
    if (f is Map && f.containsKey('booleanValue')) {
      return f['booleanValue'] as bool;
    }
    return null;
  }
  final role = stringVal('role');
  final providerId = stringVal('providerId');
  final active = boolVal('active');
  print('adminUsers/$uid');
  print('  role: ${role ?? "(not set → super-admin in rules)"}');
  print('  providerId: ${providerId ?? "(not set)"}');
  print('  active: ${active ?? "(not set → treated as active)"}');
  if (active == false) {
    print('  => BLOCKED: active is false');
  } else if (role == 'provider') {
    if (providerId == null || providerId.isEmpty) {
      print('  => BLOCKED: provider role without providerId');
    } else {
      print('  => provider account for org "$providerId"');
    }
  } else {
    print('  => super-admin (full CRM access)');
  }
}
