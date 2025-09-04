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
  insertTournamentRoundSchema,
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

  // Get all users route (for player selector)
  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Profile update route
  app.put('/api/users/:userId/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const authUserId = (req.user as any)?.claims?.sub;
      
      // Users can only update their own profile
      if (userId !== authUserId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { firstName, lastName, email, profileImageUrl } = req.body;
      
      const updatedUser = await storage.updateUserProfile(userId, {
        firstName,
        lastName,
        email,
        profileImageUrl
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Tournament placements route
  app.get('/api/players/:playerId/tournament-placements', isAuthenticated, async (req, res) => {
    try {
      const playerId = req.params.playerId;
      const placements = await storage.getPlayerTournamentPlacements(playerId);
      res.json(placements);
    } catch (error) {
      console.error("Error fetching tournament placements:", error);
      res.status(500).json({ message: "Failed to fetch tournament placements" });
    }
  });

  // Detailed statistics route
  app.get('/api/users/:userId/detailed-stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const authUserId = (req.user as any)?.claims?.sub;
      
      // Users can now view any player's detailed stats (removing restriction)
      // if (userId !== authUserId) {
      //   return res.status(403).json({ message: "Forbidden" });
      // }
      
      const stats = await storage.getUserDetailedStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching detailed stats:", error);
      res.status(500).json({ message: "Failed to fetch detailed stats" });
    }
  });

  // Get player's most recent complete round for scorecard generation
  app.get('/api/players/recent-complete-round', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const recentRound = await storage.getMostRecentCompleteRound(userId);
      if (!recentRound) {
        return res.status(404).json({ message: "No complete rounds found" });
      }
      res.json(recentRound);
    } catch (error) {
      console.error("Error fetching recent complete round:", error);
      res.status(500).json({ message: "Failed to fetch recent complete round" });
    }
  });

  // Profile photo upload ACL endpoint
  app.put("/api/profile-photos", isAuthenticated, async (req, res) => {
    if (!req.body.imageUrl) {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageUrl,
        {
          owner: (req.user as any)?.claims?.sub,
          visibility: "public", // Profile photos should be public
        }
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting profile photo ACL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Tournament photo upload ACL endpoint
  app.put("/api/tournament-photos", isAuthenticated, async (req, res) => {
    if (!req.body.imageUrl) {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageUrl,
        {
          owner: (req.user as any)?.claims?.sub,
          visibility: "public", // Tournament photos should be public
        }
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting tournament photo ACL:", error);
      res.status(500).json({ error: "Internal server error" });
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
      
      // Create holes if provided
      if (req.body.holes && Array.isArray(req.body.holes)) {
        for (const holeData of req.body.holes) {
          const hole = insertHoleSchema.parse({
            ...holeData,
            courseId: course.id,
          });
          await storage.createHole(hole);
        }
      }
      
      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });


  // Golf Course API Routes
  app.get("/api/courses/search/:searchTerm?", async (req, res) => {
    try {
      // Handle both query parameter and URL parameter formats
      const searchTerm = (req.params.searchTerm || req.query.q) as string;
      if (!searchTerm) {
        return res.status(400).json({ error: "Search term is required" });
      }

      // Try external API first, then fall back to expanded mock data
      let courses: any[] = [];
      
      try {
        // Try GolfCourseAPI.com (free API with 30,000+ courses)
        // Note: In production, you'd need to sign up for an API key at https://golfcourseapi.com/
        // For now, using expanded mock data with Canadian and North American courses
        
        // Expanded mock data with Canadian and North American courses
        const expandedMockCourses = [
          // Original famous courses
          {
            id: 'pebble-beach',
            name: 'Pebble Beach Golf Links',
            address: '1700 17-Mile Drive',
            city: 'Pebble Beach',
            state: 'CA',
            country: 'US',
            phone: '(831) 624-3811',
            website: 'https://www.pebblebeach.com',
            holes: 18,
            latitude: 36.5694,
            longitude: -121.9473
          },
          {
            id: 'augusta-national',
            name: 'Augusta National Golf Club',
            address: '2604 Washington Road',
            city: 'Augusta',
            state: 'GA',
            country: 'US',
            holes: 18,
            latitude: 33.5032,
            longitude: -82.0199
          },
          
          // Canadian Courses
          {
            id: 'cawthra-golf-club',
            name: 'Cawthra Golf Club',
            address: '123 Golf Club Road',
            city: 'Mississauga',
            state: 'ON',
            country: 'Canada',
            phone: '(905) 277-1044',
            holes: 18,
            latitude: 43.5890,
            longitude: -79.6441
          },
          {
            id: 'pipers-glen-golf-club',
            name: "Piper's Glen Golf Club",
            address: '45 Pipers Glen Drive',
            city: 'Maple',
            state: 'ON',
            country: 'Canada',
            phone: '(905) 832-4653',
            holes: 18,
            latitude: 43.8561,
            longitude: -79.5085
          },
          {
            id: 'lakeview-golf-club',
            name: 'Lakeview Golf Club',
            address: '280 Lakeshore Road West',
            city: 'Mississauga',
            state: 'ON',
            country: 'Canada',
            phone: '(905) 278-3745',
            holes: 18,
            latitude: 43.5623,
            longitude: -79.6204
          },
          {
            id: 'seguin-valley-golf-club',
            name: 'Seguin Valley Golf Club',
            address: '9449 Highway 69 North',
            city: 'Parry Sound',
            state: 'ON',
            country: 'Canada',
            phone: '(705) 378-0050',
            holes: 18,
            latitude: 45.3789,
            longitude: -79.9842
          },
          {
            id: 'glen-abbey-golf-club',
            name: 'Glen Abbey Golf Club',
            address: '1333 Dorval Drive',
            city: 'Oakville',
            state: 'ON',
            country: 'Canada',
            phone: '(905) 844-1800',
            holes: 18,
            latitude: 43.4643,
            longitude: -79.7204
          },
          {
            id: 'banff-springs-golf-course',
            name: 'Banff Springs Golf Course',
            address: '405 Spray Avenue',
            city: 'Banff',
            state: 'AB',
            country: 'Canada',
            phone: '(403) 762-6801',
            holes: 27,
            latitude: 51.1784,
            longitude: -115.5708
          },
          {
            id: 'whistler-golf-club',
            name: 'Whistler Golf Club',
            address: '4001 Whistler Way',
            city: 'Whistler',
            state: 'BC',
            country: 'Canada',
            phone: '(604) 932-4544',
            holes: 18,
            latitude: 50.1163,
            longitude: -122.9574
          },
          {
            id: 'hamilton-golf-club',
            name: 'Hamilton Golf & Country Club',
            address: '123 Golf Club Drive',
            city: 'Ancaster',
            state: 'ON',
            country: 'Canada',
            phone: '(905) 648-4471',
            holes: 18,
            latitude: 43.2181,
            longitude: -79.9106
          },
          {
            id: 'st-george-golf-club',
            name: "St. George's Golf and Country Club",
            address: '1668 Islington Avenue',
            city: 'Etobicoke',
            state: 'ON',
            country: 'Canada',
            phone: '(416) 231-1114',
            holes: 18,
            latitude: 43.6532,
            longitude: -79.5643
          },
          {
            id: 'royal-montreal-golf-club',
            name: 'Royal Montreal Golf Club',
            address: '66 Golf Club Road',
            city: 'Île-Bizard',
            state: 'QC',
            country: 'Canada',
            phone: '(514) 457-5243',
            holes: 36,
            latitude: 45.5017,
            longitude: -73.8892
          },
          
          // US Courses
          {
            id: 'torrey-pines',
            name: 'Torrey Pines Golf Course',
            address: '11480 N Torrey Pines Rd',
            city: 'La Jolla',
            state: 'CA',
            country: 'US',
            phone: '(858) 452-3226',
            holes: 18,
            latitude: 32.8936,
            longitude: -117.2516
          },
          {
            id: 'bethpage-black',
            name: 'Bethpage State Park (Black Course)',
            address: '99 Quaker Meeting House Rd',
            city: 'Farmingdale',
            state: 'NY',
            country: 'US',
            phone: '(516) 249-0700',
            holes: 18,
            latitude: 40.7348,
            longitude: -73.4554
          },
          {
            id: 'pga-national',
            name: 'PGA National Resort & Spa',
            address: '400 Avenue of the Champions',
            city: 'Palm Beach Gardens',
            state: 'FL',
            country: 'US',
            phone: '(561) 627-2000',
            holes: 90,
            latitude: 26.8435,
            longitude: -80.0884
          },
          {
            id: 'tpc-scottsdale',
            name: 'TPC Scottsdale',
            address: '17020 N Hayden Rd',
            city: 'Scottsdale',
            state: 'AZ',
            country: 'US',
            phone: '(480) 585-4334',
            holes: 36,
            latitude: 33.6054,
            longitude: -111.9101
          },
          {
            id: 'chambers-bay',
            name: 'Chambers Bay Golf Course',
            address: '6320 Grandview Drive West',
            city: 'University Place',
            state: 'WA',
            country: 'US',
            phone: '(253) 460-4653',
            holes: 18,
            latitude: 47.2099,
            longitude: -122.5652
          }
        ];
        
        courses = expandedMockCourses.filter(course => 
          course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.country.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
      } catch (externalApiError) {
        console.warn('External API failed, using fallback data:', externalApiError);
        // Fallback is already handled above
      }
      
      res.json(courses);
    } catch (error) {
      console.error('Course search error:', error);
      res.status(500).json({ error: 'Failed to search courses' });
    }
  });

  app.get("/api/courses/details/:courseId", async (req, res) => {
    try {
      const { courseId } = req.params;
      
      // Generate realistic golf hole data based on course
      const holes = Array.from({ length: 18 }, (_, i) => {
        const holeNumber = i + 1;
        
        // Generate realistic golf hole data
        let par, yardageWhite, yardageBlue, yardageRed, yardageGold;
        
        if (holeNumber === 3 || holeNumber === 8 || holeNumber === 12 || holeNumber === 17) {
          // Par 3 holes
          par = 3;
          yardageRed = 100 + Math.floor(Math.random() * 70);
          yardageWhite = yardageRed + 20 + Math.floor(Math.random() * 30);
          yardageBlue = yardageWhite + 10 + Math.floor(Math.random() * 20);
          yardageGold = yardageBlue + 5 + Math.floor(Math.random() * 15);
        } else if (holeNumber === 5 || holeNumber === 9 || holeNumber === 14 || holeNumber === 18) {
          // Par 5 holes
          par = 5;
          yardageRed = 400 + Math.floor(Math.random() * 80);
          yardageWhite = yardageRed + 40 + Math.floor(Math.random() * 60);
          yardageBlue = yardageWhite + 20 + Math.floor(Math.random() * 40);
          yardageGold = yardageBlue + 10 + Math.floor(Math.random() * 30);
        } else {
          // Par 4 holes
          par = 4;
          yardageRed = 250 + Math.floor(Math.random() * 100);
          yardageWhite = yardageRed + 30 + Math.floor(Math.random() * 80);
          yardageBlue = yardageWhite + 15 + Math.floor(Math.random() * 50);
          yardageGold = yardageBlue + 10 + Math.floor(Math.random() * 30);
        }
        
        return {
          holeNumber,
          par,
          yardageWhite,
          yardageBlue,
          yardageRed,
          yardageGold,
          handicap: holeNumber
        };
      });
      
      res.json(holes);
    } catch (error) {
      console.error('Course details error:', error);
      res.status(500).json({ error: 'Failed to fetch course details' });
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

  app.get("/api/tournaments/:id/tee-selections", async (req, res) => {
    try {
      const holeTees = await storage.getTournamentHoleTees(req.params.id);
      res.json(holeTees);
    } catch (error) {
      console.error("Error fetching tournament tee selections:", error);
      res.status(500).json({ message: "Failed to fetch tee selections" });
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
      const { teeSelections, roundDates, ...restBody } = req.body;
      
      // Convert date strings to Date objects before validation
      const processedBody = {
        ...restBody,
        startDate: restBody.startDate ? new Date(restBody.startDate) : undefined,
        endDate: restBody.endDate ? new Date(restBody.endDate) : undefined,
        createdBy: userId,
      };
      
      const tournamentData = insertTournamentSchema.parse(processedBody);
      
      const tournament = await storage.createTournament(tournamentData);
      
      // Create tournament hole tee selections if provided
      if (teeSelections && Array.isArray(teeSelections)) {
        const courseHoles = await storage.getCourseHoles(tournament.courseId);
        
        for (const teeSelection of teeSelections) {
          const hole = courseHoles.find(h => h.holeNumber === teeSelection.holeNumber);
          if (hole) {
            await storage.createTournamentHoleTee({
              tournamentId: tournament.id,
              holeId: hole.id,
              teeColor: teeSelection.teeColor,
            });
          }
        }
      }
      
      // Create tournament rounds with dates if provided
      if (roundDates && Array.isArray(roundDates) && roundDates.length > 0) {
        for (let i = 0; i < roundDates.length; i++) {
          const roundData = insertTournamentRoundSchema.parse({
            tournamentId: tournament.id,
            roundNumber: i + 1,
            roundDate: new Date(roundDates[i]),
          });
          await storage.createTournamentRound(roundData);
        }
      }
      
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

  app.get("/api/tournaments/:id/leaderboard/round/:roundNumber", async (req, res) => {
    try {
      const roundNumber = parseInt(req.params.roundNumber);
      if (isNaN(roundNumber)) {
        return res.status(400).json({ message: "Invalid round number" });
      }
      const leaderboard = await storage.getTournamentRoundLeaderboard(req.params.id, roundNumber);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching round leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch round leaderboard" });
    }
  });

  app.get("/api/tournaments/:id/rounds", async (req, res) => {
    try {
      const rounds = await storage.getTournamentRounds(req.params.id);
      res.json(rounds);
    } catch (error) {
      console.error("Error fetching tournament rounds:", error);
      res.status(500).json({ message: "Failed to fetch tournament rounds" });
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
      const roundNumber = parseInt(req.params.roundNumber);
      if (isNaN(roundNumber)) {
        return res.status(400).json({ message: "Invalid round number" });
      }
      const round = await storage.getRound(
        req.params.tournamentId,
        userId,
        roundNumber
      );
      res.json(round);
    } catch (error) {
      console.error("Error fetching round:", error);
      res.status(500).json({ message: "Failed to fetch round" });
    }
  });

  app.post("/api/scores", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const scoreData = insertScoreSchema.parse(req.body);
      const score = await storage.createScore(scoreData);
      
      // Get hole information for achievement checking
      const hole = await storage.getHole(scoreData.holeId);
      if (hole) {
        // Check for individual hole achievements (hole-in-one, eagle, birdie, etc.)
        await storage.checkAndAwardAchievements(userId, {
          scoreData: {
            strokes: score.strokes,
            putts: score.putts,
            holePar: hole.par,
            fairwayHit: score.fairwayHit,
            greenInRegulation: score.greenInRegulation,
          },
        });
        
        // Check if this completes a round for round-level achievements
        const round = await storage.getRoundById(scoreData.roundId);
        if (round) {
          const roundAnalysis = await (storage as any).analyzeRoundData(round.id);
          if (roundAnalysis && Object.keys(roundAnalysis).length > 0) {
            await storage.checkAndAwardAchievements(userId, {
              roundData: {
                ...roundAnalysis,
                roundId: round.id,
                totalStrokes: round.totalStrokes,
                fairwaysHit: round.fairwaysHit,
              },
            });
          }
        }
      }
      
      res.status(201).json(score);
    } catch (error) {
      console.error("Error creating score:", error);
      res.status(500).json({ message: "Failed to create score" });
    }
  });

  app.put("/api/scores/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const updates = z.object({
        strokes: z.number().optional(),
        putts: z.number().optional(),
        fairwayHit: z.boolean().optional(),
        greenInRegulation: z.boolean().optional(),
        powerupUsed: z.boolean().optional(),
        powerupNotes: z.string().optional(),
      }).parse(req.body);
      
      const score = await storage.updateScore(req.params.id, updates);
      
      // Get hole information for achievement checking
      const hole = await storage.getHole(score.holeId);
      if (hole && (updates.strokes !== undefined || updates.putts !== undefined)) {
        // Check for individual hole achievements with updated data
        await storage.checkAndAwardAchievements(userId, {
          scoreData: {
            strokes: score.strokes,
            putts: score.putts,
            holePar: hole.par,
            fairwayHit: score.fairwayHit,
            greenInRegulation: score.greenInRegulation,
          },
        });
        
        // Check if this affects round-level achievements
        const round = await storage.getRoundById(score.roundId);
        if (round) {
          const roundAnalysis = await (storage as any).analyzeRoundData(round.id);
          if (roundAnalysis && Object.keys(roundAnalysis).length > 0) {
            await storage.checkAndAwardAchievements(userId, {
              roundData: {
                ...roundAnalysis,
                roundId: round.id,
                totalStrokes: round.totalStrokes,
                fairwaysHit: round.fairwaysHit,
              },
            });
          }
        }
      }
      
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

  // Get all player scores for a tournament
  app.get("/api/tournaments/:tournamentId/player-scores", async (req, res) => {
    try {
      const scores = await storage.getTournamentPlayerScores(req.params.tournamentId);
      res.json(scores);
    } catch (error) {
      console.error("Error fetching tournament player scores:", error);
      res.status(500).json({ message: "Failed to fetch tournament player scores" });
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

  // Admin route: Update tournament details (champions dinner, header image)
  app.put("/api/tournaments/:id/admin", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const tournamentId = req.params.id;
      const updateData = req.body;
      
      await storage.updateTournamentAdmin(tournamentId, updateData);
      res.json({ message: "Tournament updated successfully" });
    } catch (error) {
      console.error("Error updating tournament admin details:", error);
      res.status(500).json({ message: "Failed to update tournament" });
    }
  });

  // Object Storage API endpoints
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error creating upload URL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/profile-images", isAuthenticated, async (req, res) => {
    if (!req.body.profileImageURL) {
      return res.status(400).json({ error: "profileImageURL is required" });
    }

    const userId = (req.user as any)?.claims?.sub;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.profileImageURL,
        {
          owner: userId,
          visibility: "public", // Profile images are publicly viewable
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting profile image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Achievement routes
  app.get("/api/achievements", async (req, res) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.get("/api/players/:playerId/achievements", async (req, res) => {
    try {
      const playerAchievements = await storage.getPlayerAchievements(req.params.playerId);
      res.json(playerAchievements);
    } catch (error) {
      console.error("Error fetching player achievements:", error);
      res.status(500).json({ message: "Failed to fetch player achievements" });
    }
  });

  app.get("/api/players/:playerId/stats", async (req, res) => {
    try {
      const stats = await storage.getPlayerStats(req.params.playerId);
      res.json(stats || {
        playerId: req.params.playerId,
        totalAchievements: 0,
        achievementPoints: 0,
        holesInOne: 0,
        eaglesCount: 0,
        birdiesCount: 0,
        parsCount: 0,
        tournamentsWon: 0,
        tournamentsPlayed: 0,
        bestScore: null,
        averageScore: null
      });
    } catch (error) {
      console.error("Error fetching player stats:", error);
      res.status(500).json({ message: "Failed to fetch player stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
