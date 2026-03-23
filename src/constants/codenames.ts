// A pool of ~30 funny, non-descript codenames
export const PRIVACY_CODENAMES = [
  "Angry Bird", "Rubber Duck", "Moon Walker", "Secret Squirrel",
  "Ninja Turtle", "Caffeinated Sloth", "Disco Potato", "Sneaky Hippo",
  "Zen Master", "Quantum Leap", "Neon Flamingo", "Cosmic Muffin",
  "Grumpy Cat", "Jumping Bean", "Sleepy Panda", "Magic Waffle",
  "Flying Sombrero", "Happy Penguin", "Silly Goose", "Captain Crunch",
  "Tiny Dinosaur", "Invisible Cloak", "Rocket Ship", "Super Nova",
  "Golden Snitch", "Jelly Bean", "Dancing Bear", "Wandering Nomad",
  "Mystery Machine", "Silent Knight"
] as const;

export function getRandomCodename(): string {
  const index = Math.floor(Math.random() * PRIVACY_CODENAMES.length);
  return PRIVACY_CODENAMES[index];
}
