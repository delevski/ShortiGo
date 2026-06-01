enum Category {
  forYou('for_you', 'For You'),
  newReleases('new', 'New'),
  hot('hot', 'Hot'),
  adventure('adventure', 'Adventure'),
  scary('scary', 'Scary'),
  anime('anime', 'Anime'),
  vip('vip', 'VIP');

  const Category(this.id, this.displayName);

  final String id;
  final String displayName;

  static Category fromId(String id) => Category.values.firstWhere(
        (category) => category.id == id,
        orElse: () => Category.newReleases,
      );
}
