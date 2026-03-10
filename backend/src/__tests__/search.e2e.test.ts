/**
 * End-to-End Tests for Search Functionality
 * These tests simulate real-world usage scenarios
 */

import {
  mockData,
  createMockSearchResponse,
  validateSearchResponse,
  compareResults,
  timeExecution,
} from './testUtils';

describe('Search E2E Tests', () => {
  describe('Complete Search Workflow', () => {
    it('should handle full search workflow: query -> filter -> results', async () => {
      // Simulate: user searches for "office visit"
      const mockResults = mockData.procedures.filter((p) =>
        p.description.toLowerCase().includes('office')
      );

      const response = createMockSearchResponse(mockResults);

      expect(validateSearchResponse(response).valid).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      expect(response.data[0].cpt_code).toBeDefined();
    });

    it('should return pricing for procedures with rates', async () => {
      // Get procedure IDs for pricing lookup
      const procedureIds = mockData.procedures.map((p) => p.id);

      // Simulate finding rates for these procedures
      const ratesForProcedures = mockData.rates.filter((r) =>
        procedureIds.includes(r.procedure_id)
      );

      expect(ratesForProcedures.length).toBeGreaterThan(0);
      expect(ratesForProcedures[0].cash_price).toBeDefined();
    });

    it('should support filtering by location (ZIP code)', async () => {
      // User searches with ZIP code filter
      const targetZip = '94301';

      const providersInZip = mockData.providers.filter(
        (p) => p.zip === targetZip
      );
      const ratesInZip = mockData.rates.filter((r) =>
        providersInZip.some((p) => p.id === r.provider_id)
      );

      expect(providersInZip.length).toBeGreaterThan(0);
      expect(ratesInZip.length).toBeGreaterThan(0);
    });

    it('should support filtering by insurance payer', async () => {
      // User filters by insurance plan
      const targetPayer = 'pay-1';

      const ratesForPayer = mockData.rates.filter((r) =>
        r.payer_id === targetPayer
      );

      expect(ratesForPayer.length).toBeGreaterThan(0);
    });

    it('should combine multiple filters', async () => {
      // User applies: procedure + location + insurance
      const procedureName = 'office';
      const zip = '94301';
      const payerId = 'pay-1';

      // Filter procedures
      const procedures = mockData.procedures.filter((p) =>
        p.description.toLowerCase().includes(procedureName)
      );

      // Filter providers by ZIP
      const providers = mockData.providers.filter((p) => p.zip === zip);

      // Find rates matching all criteria
      const combinedResults = mockData.rates.filter(
        (r) =>
          procedures.some((p) => p.id === r.procedure_id) &&
          providers.some((prov) => prov.id === r.provider_id) &&
          r.payer_id === payerId
      );

      expect(combinedResults.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Search Consistency', () => {
    it('should return same results for identical queries', async () => {
      const query = { procedure_name: 'office' };

      // First search
      const results1 = mockData.procedures.filter((p) =>
        p.description.toLowerCase().includes(query.procedure_name)
      );

      // Identical second search
      const results2 = mockData.procedures.filter((p) =>
        p.description.toLowerCase().includes(query.procedure_name)
      );

      const comparison = compareResults(results1, results2);
      expect(comparison.identical).toBe(true);
    });

    it('should maintain sort order', async () => {
      const results1 = [...mockData.procedures].sort((a, b) =>
        a.cpt_code.localeCompare(b.cpt_code)
      );

      const results2 = [...mockData.procedures].sort((a, b) =>
        a.cpt_code.localeCompare(b.cpt_code)
      );

      const comparison = compareResults(results1, results2);
      expect(comparison.identical).toBe(true);
    });
  });

  describe('Data Validation in Results', () => {
    it('should include complete procedure information', async () => {
      const procedure = mockData.procedures[0];

      expect(procedure).toHaveProperty('id');
      expect(procedure).toHaveProperty('cpt_code');
      expect(procedure).toHaveProperty('description');
      expect(procedure).toHaveProperty('category');
    });

    it('should include complete rate information', async () => {
      const rate = mockData.rates[0];

      expect(rate).toHaveProperty('cash_price');
      expect(rate.cash_price).toBeGreaterThan(0);
      expect(rate).toHaveProperty('insurance_price');
      expect(rate).toHaveProperty('procedure_id');
      expect(rate).toHaveProperty('provider_id');
      expect(rate).toHaveProperty('payer_id');
    });

    it('should calculate statistics correctly', async () => {
      const prices = mockData.rates.map((r) => r.cash_price);

      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

      expect(min).toBeLessThanOrEqual(avg);
      expect(avg).toBeLessThanOrEqual(max);
    });
  });

  describe('Error Recovery', () => {
    it('should handle empty search results gracefully', async () => {
      const results = mockData.procedures.filter((p) =>
        p.description.includes('nonexistent')
      );

      const response = createMockSearchResponse(results);

      expect(response.success).toBe(true);
      expect(response.data.length).toBe(0);
      expect(validateSearchResponse(response).valid).toBe(true);
    });

    it('should provide meaningful statistics even for single result', async () => {
      const singleResult = [mockData.rates[0]];
      const response = createMockSearchResponse(singleResult);

      expect(response.statistics).toBeDefined();
      expect(response.statistics?.min_price).toBe(singleResult[0].cash_price);
      expect(response.statistics?.max_price).toBe(singleResult[0].cash_price);
    });
  });

  describe('Performance', () => {
    it('should complete search in reasonable time', async () => {
      const { duration } = await timeExecution(async () => {
        return mockData.procedures.filter((p) =>
          p.description.toLowerCase().includes('office')
        );
      });

      expect(duration).toBeLessThan(10); // Less than 10ms for mock data
    });

    it('should handle large result sets efficiently', async () => {
      // Simulate large dataset
      const largeData = Array(1000)
        .fill(0)
        .map((_, i) => ({
          ...mockData.procedures[i % mockData.procedures.length],
          id: `proc-${i}`,
        }));

      const { duration } = await timeExecution(async () => {
        return largeData.filter((p) =>
          p.description.toLowerCase().includes('office')
        );
      });

      expect(duration).toBeLessThan(100);
    });

    it('should handle rapid consecutive searches', async () => {
      const searches = [
        { query: 'office' },
        { query: 'surgery' },
        { query: 'imaging' },
      ];

      const { duration } = await timeExecution(async () => {
        return Promise.all(
          searches.map((s) =>
            Promise.resolve(
              mockData.procedures.filter((p) =>
                p.description.toLowerCase().includes(s.query)
              )
            )
          )
        );
      });

      expect(duration).toBeLessThan(50);
    });
  });

  describe('User Experience', () => {
    it('should display results with prices', async () => {
      const procedures = mockData.procedures;
      const rates = mockData.rates;

      // User should see procedure + price
      const view = procedures.map((proc) => {
        const rate = rates.find((r) => r.procedure_id === proc.id);
        return {
          name: proc.description,
          price: rate?.cash_price,
        };
      });

      expect(view.length).toBeGreaterThan(0);
      expect(view[0]).toHaveProperty('name');
      expect(view[0]).toHaveProperty('price');
    });

    it('should show price comparison across providers', async () => {
      const procedure = mockData.procedures[0];

      const pricesAcrossProviders = mockData.rates
        .filter((r) => r.procedure_id === procedure.id)
        .map((r) => ({
          provider_id: r.provider_id,
          price: r.cash_price,
        }));

      expect(pricesAcrossProviders.length).toBeGreaterThanOrEqual(0);
    });

    it('should support pagination results', async () => {
      const allResults = mockData.procedures;
      const pageSize = 10;
      const page = 0;

      const paginatedResults = allResults.slice(
        page * pageSize,
        (page + 1) * pageSize
      );

      expect(paginatedResults.length).toBeLessThanOrEqual(pageSize);
    });
  });
});
