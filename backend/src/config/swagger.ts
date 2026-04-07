import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nemicare HomeCare Platform API',
      version: '1.0.0',
      description: 'REST API for Nemicare HomeCare Platform — ALF/ADH/Home Care management system',
      contact: {
        name: 'Nemicare Development Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
      schemas: {
        Lead: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            email: { type: 'string', example: 'john@example.com' },
            phone: { type: 'string', example: '555-0123' },
            status: { type: 'string', enum: ['PROSPECT', 'QUALIFIED', 'DOCUMENTATION', 'VISIT_SCHEDULED', 'CONVERTING', 'CONVERTED', 'NURTURE', 'NOT_QUALIFIED', 'CLOSED'] },
            source: { type: 'string', enum: ['WEBSITE', 'REFERRAL', 'CALL', 'FAMILY', 'ADVERTISEMENT', 'OTHER'] },
            interestedIn: { type: 'string', enum: ['ALF', 'ADH', 'HOME_CARE', 'MC', 'IL'] },
            companyId: { type: 'integer' },
            facilityId: { type: 'integer' },
          },
        },
        Resident: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            firstName: { type: 'string', example: 'Devon' },
            lastName: { type: 'string', example: 'Lane' },
            email: { type: 'string', example: 'devon@example.com' },
            phone: { type: 'string', example: '555-0133' },
            dob: { type: 'string', format: 'date' },
            gender: { type: 'string', enum: ['M', 'F', 'OTHER'] },
            status: { type: 'string', enum: ['ACTIVE', 'ON_HOLD', 'DISCHARGED', 'DECEASED'] },
            admissionType: { type: 'string', enum: ['NEW_ARRIVAL', 'READMISSION', 'TRANSFER'] },
            primaryService: { type: 'string', enum: ['ALF', 'ADH', 'HOME_CARE', 'MC', 'IL'] },
            billingType: { type: 'string', enum: ['MEDICAID', 'PRIVATE_PAY', 'INSURANCE', 'MIXED'] },
            companyId: { type: 'integer' },
            facilityId: { type: 'integer' },
          },
        },
        LeadActivity: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            leadId: { type: 'integer' },
            activityType: { type: 'string', enum: ['LEAD_CREATED', 'STATUS_CHANGED', 'NOTE_ADDED', 'CALL_MADE', 'SMS_SENT', 'VISIT_SCHEDULED', 'VISIT_COMPLETED', 'LEAD_REJECTED', 'LEAD_CONVERTED'] },
            title: { type: 'string' },
            description: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        LeadNote: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            leadId: { type: 'integer' },
            content: { type: 'string' },
            isPrivate: { type: 'boolean' },
            createdById: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            status: { type: 'integer' },
            data: { type: 'object' },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' },
                requestId: { type: 'string' },
              },
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            status: { type: 'integer' },
            data: { type: 'array', items: { type: 'object' } },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                pageSize: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            status: { type: 'integer', example: 400 },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
    paths: {
      // ========== AUTH ==========
      '/api/v1/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login with email and password',
          security: [],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', example: 'admin@demo.nemicare.local' }, password: { type: 'string', example: 'Admin@123456' } } } } } },
          responses: { '200': { description: 'Login successful — returns access token + user data' }, '401': { description: 'Invalid credentials' } },
        },
      },
      '/api/v1/auth/refresh': {
        post: {
          tags: ['Authentication'],
          summary: 'Refresh access token',
          security: [],
          responses: { '200': { description: 'New access token returned' } },
        },
      },
      '/api/v1/auth/me': {
        get: {
          tags: ['Authentication'],
          summary: 'Get current user profile',
          responses: { '200': { description: 'User profile data' }, '401': { description: 'Unauthorized' } },
        },
      },
      '/api/v1/auth/logout': {
        post: {
          tags: ['Authentication'],
          summary: 'Logout (client-side token clear)',
          responses: { '200': { description: 'Logout successful' } },
        },
      },
      // ========== LEADS ==========
      '/api/v1/leads': {
        get: {
          tags: ['Leads'],
          summary: 'List all leads (paginated, filterable)',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'source', in: 'query', schema: { type: 'string' } },
            { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search by name, email, phone' },
            { name: 'facilityId', in: 'query', schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'Paginated list of leads', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } } },
        },
        post: {
          tags: ['Leads'],
          summary: 'Create a new lead',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['firstName', 'lastName'], properties: { firstName: { type: 'string' }, lastName: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, source: { type: 'string' }, facilityId: { type: 'integer' }, interestedIn: { type: 'string', enum: ['ADH', 'ALF', 'HOME_CARE'] } } } } } },
          responses: { '201': { description: 'Lead created' }, '400': { description: 'Validation error' } },
        },
      },
      '/api/v1/leads/{id}': {
        get: {
          tags: ['Leads'],
          summary: 'Get a single lead by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '200': { description: 'Lead data' }, '404': { description: 'Lead not found' } },
        },
        put: {
          tags: ['Leads'],
          summary: 'Update a lead',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { firstName: { type: 'string' }, lastName: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, status: { type: 'string' }, notes: { type: 'string' } } } } } },
          responses: { '200': { description: 'Lead updated' }, '404': { description: 'Lead not found' } },
        },
        delete: {
          tags: ['Leads'],
          summary: 'Soft delete a lead',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '200': { description: 'Lead deleted' }, '404': { description: 'Lead not found' } },
        },
      },
      '/api/v1/leads/{id}/convert': {
        post: {
          tags: ['Leads'],
          summary: 'Convert lead to resident (Move to Residents)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['facilityId'], properties: { facilityId: { type: 'integer' } } } } } },
          responses: { '201': { description: 'Resident created from lead' }, '400': { description: 'Already converted or missing facilityId' } },
        },
      },
      // ========== LEAD ACTIVITIES & NOTES ==========
      '/api/v1/leads/{leadId}/activities': {
        get: {
          tags: ['Lead Activities'],
          summary: 'Get activity timeline for a lead',
          parameters: [
            { name: 'leadId', in: 'path', required: true, schema: { type: 'integer' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 50 } },
          ],
          responses: { '200': { description: 'Paginated activities list' } },
        },
      },
      '/api/v1/leads/{leadId}/notes': {
        get: {
          tags: ['Lead Notes'],
          summary: 'Get notes for a lead (public + current user private)',
          parameters: [{ name: 'leadId', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '200': { description: 'List of notes' } },
        },
        post: {
          tags: ['Lead Notes'],
          summary: 'Add a note to a lead',
          parameters: [{ name: 'leadId', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['content'], properties: { content: { type: 'string' }, isPrivate: { type: 'boolean', default: false } } } } } },
          responses: { '201': { description: 'Note created' }, '400': { description: 'Content required' } },
        },
      },
      '/api/v1/leads/{leadId}/notes/{noteId}': {
        put: {
          tags: ['Lead Notes'],
          summary: 'Update an existing note (creator only)',
          parameters: [
            { name: 'leadId', in: 'path', required: true, schema: { type: 'integer' } },
            { name: 'noteId', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['content'], properties: { content: { type: 'string' } } } } } },
          responses: { '200': { description: 'Note updated' }, '404': { description: 'Note not found' } },
        },
      },
      '/api/v1/leads/{leadId}/reject': {
        post: {
          tags: ['Leads'],
          summary: 'Reject a lead with reason',
          parameters: [{ name: 'leadId', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['reason'], properties: { reason: { type: 'string' } } } } } },
          responses: { '200': { description: 'Lead rejected' }, '400': { description: 'Reason required' } },
        },
      },
      // ========== RESIDENTS ==========
      '/api/v1/residents': {
        get: {
          tags: ['Residents'],
          summary: 'List all residents (paginated)',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'facilityId', in: 'query', schema: { type: 'string' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'Paginated list of residents' } },
        },
        post: {
          tags: ['Residents'],
          summary: 'Create a new resident',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Resident' } } } },
          responses: { '201': { description: 'Resident created' } },
        },
      },
      '/api/v1/residents/{id}': {
        get: {
          tags: ['Residents'],
          summary: 'Get a single resident by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '200': { description: 'Resident data' }, '404': { description: 'Resident not found' } },
        },
        put: {
          tags: ['Residents'],
          summary: 'Update a resident',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { firstName: { type: 'string' }, lastName: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, status: { type: 'string' } } } } } },
          responses: { '200': { description: 'Resident updated' } },
        },
        delete: {
          tags: ['Residents'],
          summary: 'Soft delete a resident',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '200': { description: 'Resident deleted' } },
        },
      },
      '/api/v1/residents/{id}/discharge': {
        post: {
          tags: ['Residents'],
          summary: 'Discharge a resident',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['dischargeDate', 'dischargeReason'], properties: { dischargeDate: { type: 'string', format: 'date' }, dischargeReason: { type: 'string' } } } } } },
          responses: { '200': { description: 'Resident discharged' } },
        },
      },
      // ========== HEALTH ==========
      '/health': {
        get: {
          tags: ['System'],
          summary: 'Health check',
          security: [],
          responses: { '200': { description: 'Service is running' } },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
