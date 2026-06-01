import 'package:better_player_plus/better_player_plus.dart';
import 'package:flutter/material.dart';

class EpisodePlayerView extends StatefulWidget {
  const EpisodePlayerView({super.key, required this.controller});

  final BetterPlayerController controller;

  @override
  State<EpisodePlayerView> createState() => _EpisodePlayerViewState();
}

class _EpisodePlayerViewState extends State<EpisodePlayerView> {
  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 9 / 16,
      child: BetterPlayer(controller: widget.controller),
    );
  }

  @override
  void dispose() {
    widget.controller.dispose();
    super.dispose();
  }
}
