// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "CellBlock",
    defaultLocalization: "en",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .library(
            name: "CellBlock",
            targets: ["CellBlock"]
        )
    ],
    dependencies: [
        // Socket.IO client for WebSocket communication
        .package(
            url: "https://github.com/socketio/socket.io-client-swift",
            from: "16.0.0"
        )
    ],
    targets: [
        .target(
            name: "CellBlock",
            dependencies: [
                .product(name: "SocketIO", package: "socket.io-client-swift")
            ],
            path: "CellBlock/Sources"
        ),
        .testTarget(
            name: "CellBlockTests",
            dependencies: ["CellBlock"],
            path: "CellBlock/Tests"
        )
    ]
)
