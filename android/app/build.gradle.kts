import java.io.FileInputStream
import java.util.Base64
import java.util.Properties

plugins {
    id("com.android.application")
    // START: FlutterFire Configuration
    id("com.google.gms.google-services")
    id("com.google.firebase.firebase-perf")
    // END: FlutterFire Configuration
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

// Google AdMob test app ID; override with --dart-define=ADMOB_APP_ID_ANDROID=...
val defaultAdMobAppId = "ca-app-pub-3940256099942544~3347511713"
val dartDefines = mutableMapOf<String, String>()
if (project.hasProperty("dart-defines")) {
    val encodedDefines = project.property("dart-defines") as String
    encodedDefines.split(",").filter { it.isNotEmpty() }.forEach { encoded ->
        val decoded = String(Base64.getDecoder().decode(encoded))
        val parts = decoded.split("=", limit = 2)
        if (parts.size == 2) {
            dartDefines[parts[0]] = parts[1]
        }
    }
}
val admobAppId = dartDefines["ADMOB_APP_ID_ANDROID"] ?: defaultAdMobAppId

// Release guard: a release build that would crash on launch (RevenueCat test
// key), ship Google's sample ad IDs, or be signed with the debug key fails
// here, at build time, instead of being rejected by Google Play afterwards.
// Set SHORTIGO_ALLOW_UNSAFE_RELEASE=1 only for throwaway smoke builds.
val isReleaseBuild = gradle.startParameter.taskNames.any {
    it.contains("release", ignoreCase = true)
}
if (isReleaseBuild && System.getenv("SHORTIGO_ALLOW_UNSAFE_RELEASE") != "1") {
    val googleSampleAdMobPrefix = "ca-app-pub-3940256099942544"
    val problems = mutableListOf<String>()
    val rcKey = dartDefines["RC_API_KEY_ANDROID"].orEmpty().trim()
    if (rcKey.isEmpty()) {
        problems.add("RC_API_KEY_ANDROID is empty (use the RevenueCat goog_ public key).")
    } else if (rcKey.lowercase().startsWith("test_")) {
        problems.add("RC_API_KEY_ANDROID is a RevenueCat TEST key (test_...). The app would show 'Wrong API Key' and close. Use the goog_ key.")
    }
    val adMobAppIdValue = dartDefines["ADMOB_APP_ID_ANDROID"].orEmpty()
    if (adMobAppIdValue.isEmpty() || adMobAppIdValue.startsWith(googleSampleAdMobPrefix)) {
        problems.add("ADMOB_APP_ID_ANDROID is missing or Google's sample ID.")
    }
    val adMobRewardedValue = dartDefines["ADMOB_REWARDED_ANDROID"].orEmpty()
    if (adMobRewardedValue.isEmpty() || adMobRewardedValue.startsWith(googleSampleAdMobPrefix)) {
        problems.add("ADMOB_REWARDED_ANDROID is missing or Google's sample ad unit ID.")
    }
    if (!keystorePropertiesFile.exists()) {
        problems.add("android/key.properties is missing: the bundle would be signed with the debug key and Google Play rejects it.")
    }
    if (problems.isNotEmpty()) {
        throw GradleException(
            "ShortiGo release build blocked:\n" +
                problems.joinToString("\n") { " - $it" } +
                "\nFix dart_defines.json / key.properties, or run tools\\release-android.cmd."
        )
    }
}

android {
    namespace = "com.shortigo.shortigo"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.shortigo.shortigo"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        manifestPlaceholders["admobAppId"] = admobAppId
    }

    signingConfigs {
        create("release") {
            if (keystorePropertiesFile.exists()) {
                keyAlias = keystoreProperties["keyAlias"] as String
                keyPassword = keystoreProperties["keyPassword"] as String
                storeFile = rootProject.file(keystoreProperties["storeFile"] as String)
                storePassword = keystoreProperties["storePassword"] as String
            }
        }
    }

    buildTypes {
        release {
            signingConfig = if (keystorePropertiesFile.exists()) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
        }
    }
}

flutter {
    source = "../.."
}
