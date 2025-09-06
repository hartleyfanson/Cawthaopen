import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateAchievementImage(achievementName: string, description: string): Promise<string> {
  try {
    // Create a detailed prompt based on the achievement
    const prompt = createImagePrompt(achievementName, description);
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return response.data?.[0]?.url || "";
  } catch (error) {
    console.error("Error generating achievement image:", error);
    throw new Error("Failed to generate achievement image");
  }
}

function createImagePrompt(name: string, description: string): string {
  const lowerName = name.toLowerCase();
  const lowerDesc = description.toLowerCase();

  // Golf-specific image prompts based on achievement names and descriptions
  if (lowerName.includes('eagle')) {
    return "A majestic golden eagle soaring over a pristine golf course at sunrise, wings spread wide, with a golf flag visible below on a perfectly manicured green. Professional photography style, cinematic lighting, inspirational and triumphant mood.";
  }
  
  if (lowerName.includes('birdie') || lowerDesc.includes('birdie')) {
    return "A beautiful songbird perched on a golf flag, with morning dew on emerald grass and soft golden sunlight filtering through. Elegant and peaceful golf course setting, professional nature photography style.";
  }
  
  if (lowerName.includes('hole in one') || lowerName.includes('ace')) {
    return "A golf ball frozen in mid-air just above the hole on a pristine green, with the flag casting a shadow and crowd silhouettes in the background. Dramatic sports photography, golden hour lighting, moment of triumph.";
  }
  
  if (lowerName.includes('weather') || lowerName.includes('storm')) {
    return "A determined golfer silhouetted against dramatic storm clouds on a golf course, rain and wind visible but showing perseverance. Moody atmospheric lighting, inspiring resilience theme.";
  }
  
  if (lowerName.includes('nice') || lowerDesc.includes('69')) {
    return "A vintage golf scorecard showing '69' with elegant calligraphy, surrounded by classic golf accessories like a leather glove and wooden tees on rich mahogany. Sophisticated vintage golf aesthetic.";
  }
  
  if (lowerName.includes('consistent') || lowerName.includes('streak')) {
    return "A perfectly aligned row of golf balls on tees stretching into the distance on a driving range, representing consistency and dedication. Clean, minimalist composition with soft morning light.";
  }
  
  if (lowerName.includes('tournament') || lowerName.includes('debut')) {
    return "An elegant golf tournament entrance with banners and flags, players walking toward the first tee in early morning mist. Professional tournament atmosphere, prestigious and welcoming.";
  }
  
  if (lowerName.includes('iron') || lowerName.includes('precision')) {
    return "A gleaming set of professional golf irons arranged artistically with perfect shadows, reflecting craftsmanship and precision. Studio lighting, luxury sports equipment photography style.";
  }
  
  if (lowerName.includes('marathon') || lowerName.includes('endurance')) {
    return "A golfer's silhouette walking across rolling hills of a golf course at sunset, bag on shoulder, showing the journey and dedication of the sport. Inspirational landscape photography.";
  }
  
  // Default golf achievement image
  return `A professional golf-themed illustration representing '${name}'. ${description}. Clean, elegant design with golf course elements like greens, flags, and golf equipment. Warm golden and emerald green color palette, inspirational and achievement-focused mood.`;
}