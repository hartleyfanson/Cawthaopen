import { Achievement } from "@shared/schema";

export interface SkillTreeCategory {
  id: string;
  name: string;
  icon: any;
  color: string;
  description: string;
  achievements: Achievement[];
}