import * as sysMsg from '../../../constants/system.messages';
/**
 * Swagger documentation for Class Subject endpoints.
 *
 * @module Class
 */

export const ClassSubjectSwagger = {
  tags: ['Class Subjects'],
  summary: 'Class Subjects Management',
  description:
    'Endpoints for creating, retrieving, updating, and deleting class subjects.',
  endpoints: {
    list: {
      operation: {
        summary: 'Get subjects assigned to a class',
        description:
          'Returns a list of subjects assigned to a specific class ID.',
      },
      parameters: {
        classId: {
          name: 'classId',
          description: 'The Class ID',
        },
      },
      responses: {
        ok: {
          description: 'List of assigned subjects',
          schema: {
            type: 'object',
            properties: {
              status_code: { type: 'integer', example: 200 },
              message: {
                type: 'string',
                example: 'Class subjects fetched successfully',
              },
              data: {
                type: 'object',
                properties: {
                  payload: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'string',
                          example: '96b3434b-c13f-4f16-b214-b0c05447b2ef',
                        },
                        createdAt: {
                          type: 'string',
                          format: 'date-time',
                          example: '2025-11-28T14:19:09.580Z',
                        },
                        updatedAt: {
                          type: 'string',
                          format: 'date-time',
                          example: '2025-11-28T19:58:37.566Z',
                        },
                        teacher_assignment_date: {
                          type: 'string',
                          format: 'date-time',
                          nullable: true,
                          example: '2025-11-28T19:58:37.564Z',
                        },

                        subject: {
                          type: 'object',
                          properties: {
                            id: {
                              type: 'string',
                              example: '7fa19ae7-a57f-4459-859e-5e30d419a73d',
                            },
                            createdAt: {
                              type: 'string',
                              format: 'date-time',
                              example: '2025-11-28T14:07:04.810Z',
                            },
                            updatedAt: {
                              type: 'string',
                              format: 'date-time',
                              example: '2025-11-28T14:07:04.810Z',
                            },
                            name: {
                              type: 'string',
                              example: 'Biology',
                            },
                          },
                        },

                        teacher: {
                          type: 'object',
                          nullable: true,
                          properties: {
                            id: {
                              type: 'string',
                              example: 'b499d214-6cc7-447d-b4de-6259f34f955d',
                            },
                            createdAt: {
                              type: 'string',
                              format: 'date-time',
                              example: '2025-11-28T19:54:40.551Z',
                            },
                            updatedAt: {
                              type: 'string',
                              format: 'date-time',
                              example: '2025-11-28T19:54:40.551Z',
                            },
                            user_id: {
                              type: 'string',
                              example: '5b01a700-9119-4e40-865a-1b069cda8874',
                            },
                            employment_id: {
                              type: 'string',
                              example: 'EMP-2025-001',
                            },
                            title: {
                              type: 'string',
                              example: 'Miss',
                            },
                            photo_url: {
                              type: 'string',
                              example:
                                'https://example.com/photos/teacher123.jpg',
                            },
                            is_active: {
                              type: 'boolean',
                              example: true,
                            },
                          },
                        },
                      },
                    },
                  },

                  paginationMeta: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer', example: 2 },
                    },
                  },
                },
              },
            },
          },
        },
        notFound: {
          description: 'Class not found',
        },
      },
    },
    assignTeacherToClass: {
      operation: {
        summary: 'Assigns a Teacher to a Subject in a Class (Admin)',
        description: 'Assigns a teacher to a subject in a class.',
      },
      parameters: {
        classId: {
          name: 'classId',
          description: 'The Class ID',
        },
        subjectId: {
          name: 'subjectId',
          description: 'The Subject ID',
        },
      },
      responses: {
        ok: {
          description: sysMsg.TEACHER_ASSIGNED,
        },
        notFound: {
          description: sysMsg.CLASS_SUBJECT_NOT_FOUND,
        },
        conflict: {
          description: sysMsg.CLASS_SUBJECT_ALREADY_HAS_A_TEACHER,
        },
      },
    },
    unassignTeacherFromClass: {
      operation: {
        summary: 'Unassign a Teacher from a Subject in a Class (Admin)',
        description: 'Unassign a teacher from a subject in a class.',
      },
      parameters: {
        classId: {
          name: 'classId',
          description: 'The Class ID',
        },
        subjectId: {
          name: 'subjectId',
          description: 'The Subject ID',
        },
      },
      responses: {
        ok: {
          description: sysMsg.TEACHER_UNASSIGNED_FROM_SUBJECT,
        },
        notFound: {
          description: sysMsg.CLASS_SUBJECT_NOT_FOUND,
        },
        badRequest: {
          description: sysMsg.TEACHER_NOT_ASSIGNED_TO_SUBJECT,
        },
      },
    },
  },
};
