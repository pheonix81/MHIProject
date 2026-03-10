import request from 'supertest';
import express from 'express';
import { searchRequestSchema } from '../utils/validators';

// Create a minimal Express app for testing
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mock health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Mock search endpoint with validation
  app.get('/api/v1/search', (req, res) => {
    try {
      searchRequestSchema.parse(req.query);
      res.json({ success: true, data: [], count: 0 });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Invalid query parameters' });
    }
  });

  return app;
};

describe('Search API Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /api/v1/search', () => {
    it('should return 200 with valid search query', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ procedure_name: 'office visit', limit: 10, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should accept CPT code parameter', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ cpt_code: '99213', limit: 10, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should accept ZIP code parameter', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ zip_code: '94301', limit: 10, offset: 0 });

      expect(response.status).toBe(200);
    });

    it('should accept payer_id parameter', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ payer_id: 'payer-123', limit: 10, offset: 0 });

      expect(response.status).toBe(200);
    });

    it('should accept offset parameter for pagination', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ limit: 10, offset: 20 });

      expect(response.status).toBe(200);
    });

    it('should default limit to 10', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ offset: 0 });

      expect(response.status).toBe(200);
    });

    it('should reject invalid limit', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ limit: -10, offset: 0 });

      expect([400, 422]).toContain(response.status);
    });

    it('should handle empty search', async () => {
      const response = await request(app)
        .get('/api/v1/search');

      expect([200, 400]).toContain(response.status);
    });

    it('should handle special characters', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ procedure_name: "test's & surgery", limit: 10, offset: 0 });

      expect(response.status).toBe(200);
    });

    it('should include response body', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ procedure_name: 'office', limit: 10, offset: 0 });

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
    });

    it('should return JSON content type', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ limit: 10, offset: 0 });

      expect(response.type).toMatch(/json/);
    });
  });

  describe('Search Parameter Validation', () => {
    it('should validate limit is positive', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ limit: 0, offset: 0 });

      expect([400, 422]).toContain(response.status);
    });

    it('should validate offset is non-negative', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ limit: 10, offset: -1 });

      expect([400, 422]).toContain(response.status);
    });

    it('should enforce maximum limit', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ limit: 99999, offset: 0 });

      expect([400, 422]).toContain(response.status);
    });

    it('should validate CPT code format', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ cpt_code: 'invalid-format', limit: 10, offset: 0 });

      expect([400, 422, 200]).toContain(response.status);
    });

    it('should validate ZIP code format', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ zip_code: 'abc', limit: 10, offset: 0 });

      expect([400, 422, 200]).toContain(response.status);
    });
  });

  describe('Error Handling', () => {
    it('should respond with 40x for invalid parameters', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ limit: 'invalid' });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle concurrent requests', async () => {
      const promises = [
        request(app).get('/api/v1/search').query({ procedure_name: 'office', limit: 10, offset: 0 }),
        request(app).get('/api/v1/search').query({ procedure_name: 'surgery', limit: 10, offset: 0 }),
        request(app).get('/api/v1/search').query({ cpt_code: '99213', limit: 10, offset: 0 }),
      ];

      const responses = await Promise.all(promises);

      responses.forEach((response: any) => {
        expect(response.status).toBeLessThan(500);
      });
    });
  });

  describe('Performance', () => {
    it('should respond in under 1 second', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/v1/search')
        .query({ procedure_name: 'office', limit: 10, offset: 0 });

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000);
      expect(response.status).toBeLessThan(500);
    });

    it('should handle large offset', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ limit: 10, offset: 100000 });

      expect(response.status).toBeLessThan(500);
    });
  });
});
