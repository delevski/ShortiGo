import 'package:cloud_firestore/cloud_firestore.dart';

Map<String, dynamic> firestoreJson(
  Map<String, dynamic> data, {
  String? id,
}) {
  return {
    ...data.map((key, value) => MapEntry(key, firestoreValue(value))),
    if (id != null) 'id': id,
  };
}

Object? firestoreValue(Object? value) {
  if (value is Timestamp) {
    return value.toDate().toUtc().toIso8601String();
  }
  if (value is DateTime) {
    return value.toUtc().toIso8601String();
  }
  if (value is List) {
    return value.map(firestoreValue).toList();
  }
  if (value is Map) {
    return value.map(
      (key, child) => MapEntry(key.toString(), firestoreValue(child)),
    );
  }
  return value;
}
