import "dotenv/config";

const world = "world";

export function hello(who: string = world): string {
  return `Hello ${who}! `;
}

console.log(hello());

console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY);
