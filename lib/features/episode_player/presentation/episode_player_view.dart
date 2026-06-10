import 'package:better_player_plus/better_player_plus.dart';
import 'package:flutter/material.dart';

class EpisodePlayerView extends StatefulWidget {
  const EpisodePlayerView({super.key, required this.controller});

  final BetterPlayerController controller;

  @override
  State<EpisodePlayerView> createState() => _EpisodePlayerViewState();
}

class _EpisodePlayerViewState extends State<EpisodePlayerView>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox.expand(
      child: LayoutBuilder(
        builder: (context, constraints) {
          final aspectRatio = episodePlayerViewportAspectRatio(
            width: constraints.maxWidth,
            height: constraints.maxHeight,
          );
          if (aspectRatio != null) {
            widget.controller.setOverriddenAspectRatio(aspectRatio);
          }

          return BetterPlayer(controller: widget.controller);
        },
      ),
    );
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    widget.controller.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (shouldPauseVideoForLifecycle(state)) {
      widget.controller.pause();
    }
  }
}

double? episodePlayerViewportAspectRatio({
  required double width,
  required double height,
}) {
  if (width <= 0 || height <= 0) {
    return null;
  }

  return width / height;
}

bool shouldPauseVideoForLifecycle(AppLifecycleState state) {
  return switch (state) {
    AppLifecycleState.resumed => false,
    AppLifecycleState.inactive ||
    AppLifecycleState.hidden ||
    AppLifecycleState.paused ||
    AppLifecycleState.detached =>
      true,
  };
}
