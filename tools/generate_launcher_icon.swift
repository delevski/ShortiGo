import AppKit
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

struct IconTarget {
    let path: String
    let size: Int
}

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)

let androidTargets = [
    IconTarget(path: "android/app/src/main/res/mipmap-mdpi/ic_launcher.png", size: 48),
    IconTarget(path: "android/app/src/main/res/mipmap-hdpi/ic_launcher.png", size: 72),
    IconTarget(path: "android/app/src/main/res/mipmap-xhdpi/ic_launcher.png", size: 96),
    IconTarget(path: "android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png", size: 144),
    IconTarget(path: "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png", size: 192),
]

let iosTargets = [
    IconTarget(path: "ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-20x20@1x.png", size: 20),
    IconTarget(path: "ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-20x20@2x.png", size: 40),
    IconTarget(path: "ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-20x20@3x.png", size: 60),
    IconTarget(path: "ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-29x29@1x.png", size: 29),
    IconTarget(path: "ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-29x29@2x.png", size: 58),
    IconTarget(path: "ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-29x29@3x.png", size: 87),
    IconTarget(path: "ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-40x40@1x.png", size: 40),
    IconTarget(path: "ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-40x40@2x.png", size: 80),
    IconTarget(path: "ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-40x40@3x.png", size: 120),
    IconTarget(path: "ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-60x60@2x.png", size: 120),
    IconTarget(path: "ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-60x60@3x.png", size: 180),
    IconTarget(path: "ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-76x76@1x.png", size: 76),
    IconTarget(path: "ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-76x76@2x.png", size: 152),
    IconTarget(path: "ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-83.5x83.5@2x.png", size: 167),
    IconTarget(path: "ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-1024x1024@1x.png", size: 1024),
]

let projectTargets = [
    IconTarget(path: "assets/branding/shortigo_launcher_icon_1024.png", size: 1024),
]

func drawIcon(size: Int) -> CGImage {
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let context = CGContext(
        data: nil,
        width: size,
        height: size,
        bitsPerComponent: 8,
        bytesPerRow: 0,
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    ) else {
        fatalError("Could not create drawing context")
    }

    let scale = CGFloat(size) / 1024.0
    context.scaleBy(x: scale, y: scale)
    context.setShouldAntialias(true)
    context.setAllowsAntialiasing(true)
    context.interpolationQuality = .high

    context.setFillColor(CGColor(red: 0.043, green: 0.024, blue: 0.075, alpha: 1))
    context.fill(CGRect(x: 0, y: 0, width: 1024, height: 1024))

    let tileRect = CGRect(x: 96, y: 96, width: 832, height: 832)
    let tilePath = CGPath(
        roundedRect: tileRect,
        cornerWidth: 220,
        cornerHeight: 220,
        transform: nil
    )
    context.saveGState()
    context.addPath(tilePath)
    context.clip()
    let gradient = CGGradient(
        colorsSpace: colorSpace,
        colors: [
            CGColor(red: 0.91, green: 0.47, blue: 0.98, alpha: 1),
            CGColor(red: 0.55, green: 0.36, blue: 0.96, alpha: 1),
            CGColor(red: 0.082, green: 0.063, blue: 0.122, alpha: 1),
        ] as CFArray,
        locations: [0.0, 0.42, 1.0]
    )!
    context.drawRadialGradient(
        gradient,
        startCenter: CGPoint(x: 328, y: 224),
        startRadius: 10,
        endCenter: CGPoint(x: 626, y: 778),
        endRadius: 860,
        options: [.drawsBeforeStartLocation, .drawsAfterEndLocation]
    )
    context.restoreGState()

    context.setStrokeColor(CGColor(red: 1, green: 1, blue: 1, alpha: 0.16))
    context.setLineWidth(18)
    context.addPath(CGPath(roundedRect: CGRect(x: 128, y: 128, width: 768, height: 768), cornerWidth: 188, cornerHeight: 188, transform: nil))
    context.strokePath()

    let playPath = CGMutablePath()
    playPath.move(to: CGPoint(x: 405, y: 317))
    playPath.addCurve(to: CGPoint(x: 463, y: 285), control1: CGPoint(x: 405, y: 287), control2: CGPoint(x: 438, y: 269))
    playPath.addLine(to: CGPoint(x: 686, y: 434))
    playPath.addCurve(to: CGPoint(x: 686, y: 560), control1: CGPoint(x: 731, y: 464), control2: CGPoint(x: 731, y: 530))
    playPath.addLine(to: CGPoint(x: 463, y: 709))
    playPath.addCurve(to: CGPoint(x: 405, y: 677), control1: CGPoint(x: 438, y: 725), control2: CGPoint(x: 405, y: 707))
    playPath.closeSubpath()

    context.setShadow(offset: CGSize(width: 0, height: 18), blur: 22, color: CGColor(red: 0, green: 0, blue: 0, alpha: 0.34))
    context.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
    context.addPath(playPath)
    context.fillPath()
    context.setShadow(offset: .zero, blur: 0, color: nil)

    context.setFillColor(CGColor(red: 1, green: 0.82, blue: 0.40, alpha: 1))
    context.fillEllipse(in: CGRect(x: 656, y: 680, width: 136, height: 136))
    context.setFillColor(CGColor(red: 1, green: 0.96, blue: 0.78, alpha: 1))
    context.fillEllipse(in: CGRect(x: 690, y: 714, width: 68, height: 68))

    guard let image = context.makeImage() else {
        fatalError("Could not create icon image")
    }
    return image
}

func writePNG(_ image: CGImage, to url: URL) {
    try? FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
    guard let destination = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil) else {
        fatalError("Could not create PNG destination for \(url.path)")
    }
    CGImageDestinationAddImage(destination, image, nil)
    guard CGImageDestinationFinalize(destination) else {
        fatalError("Could not write PNG to \(url.path)")
    }
}

for target in projectTargets + androidTargets + iosTargets {
    let image = drawIcon(size: target.size)
    writePNG(image, to: root.appendingPathComponent(target.path))
    print("Wrote \(target.path) (\(target.size)x\(target.size))")
}
