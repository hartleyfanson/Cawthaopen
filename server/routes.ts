import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import {
  insertCourseSchema,
  insertHoleSchema,
  insertTournamentSchema,
  insertTournamentPlayerSchema,
  insertRoundSchema,
  insertScoreSchema,
  insertGalleryPhotoSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Object storage routes for protected uploads
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    const userId = (req.user as any)?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  // Course routes
  app.get("/api/courses", async (req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.get("/api/courses/:id/holes", async (req, res) => {
    try {
      const holes = await storage.getCourseHoles(req.params.id);
      res.json(holes);
    } catch (error) {
      console.error("Error fetching course holes:", error);
      res.status(500).json({ message: "Failed to fetch course holes" });
    }
  });

  app.post("/api/courses", isAuthenticated, async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(courseData);
      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.post("/api/holes", isAuthenticated, async (req, res) => {
    try {
      const holeData = insertHoleSchema.parse(req.body);
      const hole = await storage.createHole(holeData);
      res.status(201).json(hole);
    } catch (error) {
      console.error("Error creating hole:", error);
      res.status(500).json({ message: "Failed to create hole" });
    }
  });

  // Tournament routes
  app.get("/api/tournaments", async (req, res) => {
    try {
      const tournaments = await storage.getTournaments();
      res.json(tournaments);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
      res.status(500).json({ message: "Failed to fetch tournaments" });
    }
  });

  app.get("/api/tournaments/:id", async (req, res) => {
    try {
      const tournament = await storage.getTournament(req.params.id);
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      res.json(tournament);
    } catch (error) {
      console.error("Error fetching tournament:", error);
      res.status(500).json({ message: "Failed to fetch tournament" });
    }
  });

  app.get("/api/tournaments/status/:status", async (req, res) => {
    try {
      const tournaments = await storage.getTournamentsByStatus(req.params.status);
      res.json(tournaments);
    } catch (error) {
      console.error("Error fetching tournaments by status:", error);
      res.status(500).json({ message: "Failed to fetch tournaments" });
    }
  });

  app.post("/api/tournaments", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const tournamentData = insertTournamentSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      const tournament = await storage.createTournament(tournamentData);
      res.status(201).json(tournament);
    } catch (error) {
      console.error("Error creating tournament:", error);
      res.status(500).json({ message: "Failed to create tournament" });
    }
  });

  app.post("/api/tournaments/:id/join", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const data = insertTournamentPlayerSchema.parse({
        tournamentId: req.params.id,
        playerId: userId,
        ...req.body,
      });
      const player = await storage.joinTournament(data);
      res.status(201).json(player);
    } catch (error) {
      console.error("Error joining tournament:", error);
      res.status(500).json({ message: "Failed to join tournament" });
    }
  });

  app.get("/api/tournaments/:id/players", async (req, res) => {
    try {
      const players = await storage.getTournamentPlayers(req.params.id);
      res.json(players);
    } catch (error) {
      console.error("Error fetching tournament players:", error);
      res.status(500).json({ message: "Failed to fetch tournament players" });
    }
  });

  app.get("/api/tournaments/:id/leaderboard", async (req, res) => {
    try {
      const leaderboard = await storage.getTournamentLeaderboard(req.params.id);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Scoring routes
  app.post("/api/rounds", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const roundData = insertRoundSchema.parse({
        ...req.body,
        playerId: userId,
      });
      const round = await storage.createRound(roundData);
      res.status(201).json(round);
    } catch (error) {
      console.error("Error creating round:", error);
      res.status(500).json({ message: "Failed to create round" });
    }
  });

  app.get("/api/rounds/:tournamentId/:roundNumber", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const round = await storage.getRound(
        req.params.tournamentId,
        userId,
        parseInt(req.params.roundNumber)
      );
      res.json(round);
    } catch (error) {
      console.error("Error fetching round:", error);
      res.status(500).json({ message: "Failed to fetch round" });
    }
  });

  app.post("/api/scores", isAuthenticated, async (req, res) => {
    try {
      const scoreData = insertScoreSchema.parse(req.body);
      const score = await storage.createScore(scoreData);
      res.status(201).json(score);
    } catch (error) {
      console.error("Error creating score:", error);
      res.status(500).json({ message: "Failed to create score" });
    }
  });

  app.put("/api/scores/:id", isAuthenticated, async (req, res) => {
    try {
      const updates = z.object({
        strokes: z.number().optional(),
        putts: z.number().optional(),
        fairwayHit: z.boolean().optional(),
        greenInRegulation: z.boolean().optional(),
        powerupUsed: z.boolean().optional(),
        powerupNotes: z.string().optional(),
      }).parse(req.body);
      
      const score = await storage.updateScore(req.params.id, updates);
      res.json(score);
    } catch (error) {
      console.error("Error updating score:", error);
      res.status(500).json({ message: "Failed to update score" });
    }
  });

  app.get("/api/rounds/:roundId/scores", async (req, res) => {
    try {
      const scores = await storage.getRoundScores(req.params.roundId);
      res.json(scores);
    } catch (error) {
      console.error("Error fetching round scores:", error);
      res.status(500).json({ message: "Failed to fetch round scores" });
    }
  });

  // Gallery routes
  app.get("/api/tournaments/:id/gallery", async (req, res) => {
    try {
      const photos = await storage.getTournamentGallery(req.params.id);
      res.json(photos);
    } catch (error) {
      console.error("Error fetching gallery:", error);
      res.status(500).json({ message: "Failed to fetch gallery" });
    }
  });

  app.post("/api/gallery", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const photoData = insertGalleryPhotoSchema.parse({
        ...req.body,
        uploadedBy: userId,
      });

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageUrl,
        {
          owner: userId,
          visibility: "public",
        },
      );

      const photo = await storage.createGalleryPhoto({
        ...photoData,
        imageUrl: objectPath,
      });
      
      res.status(201).json(photo);
    } catch (error) {
      console.error("Error creating gallery photo:", error);
      res.status(500).json({ message: "Failed to create gallery photo" });
    }
  });

  // User stats routes
  app.get("/api/users/:id/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getUserStats(req.params.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
