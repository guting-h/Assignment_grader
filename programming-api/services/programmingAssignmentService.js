import { sql } from "../database/database.js";

const findAll = async () => {
  return await sql`SELECT * FROM programming_assignments;`;
};

const findById = async (id) => {  
  return await sql`SELECT * FROM programming_assignments WHERE id = ${id};`;
}

const findSubmissionByUser = async (userId) => {
  return await sql`SELECT * FROM programming_assignment_submissions WHERE user_uuid = ${userId};`
}

const findActiveSubmission = async (userId) => {
  return await sql`SELECT * FROM programming_assignment_submissions WHERE user_uuid = ${userId} AND status != 'processed'`;
}

const findMatchingSubmission = async (userId, assignmentId, code) => {
  return await sql`
    SELECT * 
    FROM programming_assignment_submissions 
    WHERE user_uuid = ${userId} 
      AND programming_assignment_id = ${assignmentId}
      AND code = ${code};
  `
}

const createSubmission = async(userId, assgId, code) => {
  return await sql`
    INSERT INTO programming_assignment_submissions (programming_assignment_id, code, user_uuid, status)
    VALUES (${assgId}, ${code}, ${userId}, 'pending')
    RETURNING id;
  `
}

const updateSubmission = async (submissionId, feedback, correct) => {
  return await sql`
    UPDATE programming_assignment_submissions
    SET status = 'processed', grader_feedback = ${feedback}, correct = ${correct}
    WHERE id = ${submissionId};
  `;
};

const findSubmissionById = async (submissionId) => {
  const result = await sql`
    SELECT id, programming_assignment_id, user_uuid, status, grader_feedback, correct
    FROM programming_assignment_submissions
    WHERE id = ${submissionId};
  `;
  return result.length > 0 ? result[0] : null;
};

// find the first incompleted assignment for a user
// const findIncompleteAssignment = async (userId) => {
//   return await sql`
//     SELECT a.id, a.title, a.assignment_order, a.handout
//     FROM programming_assignments a
//     WHERE NOT EXISTS (
//         SELECT 1
//         FROM programming_assignment_submissions s
//         WHERE s.programming_assignment_id = a.id
//         AND s.user_uuid = ${userId}
//         AND s.correct = TRUE
//     )
//     ORDER BY a.assignment_order
//     LIMIT 1;
//   `
// }

const findUniqueCorrectAssignments = async (userId) => {
  return await sql`
    SELECT DISTINCT programming_assignment_id 
    FROM programming_assignment_submissions
    WHERE user_uuid = ${userId}
    AND status = 'processed'
    AND correct = true;
  `;
}


export { 
  findAll, 
  findById, 
  findSubmissionByUser,
  findMatchingSubmission,
  createSubmission,
  updateSubmission,
  findSubmissionById,
  findActiveSubmission,
  findUniqueCorrectAssignments
};
