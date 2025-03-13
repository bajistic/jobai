## Prompt for Implementing Optimized Job Filtering

### Objective

Enhance the current job filtering system to reduce OpenAI API costs while maintaining high accuracy in job recommendations. The new approach should filter 1,300 jobs once daily using a comprehensive prompt, store the results, and enable local personalization based on user preferences—all without deleting or overwriting existing functions.

### Context

- **Current System:** You filter 1,300 jobs daily for each user using their individual `jobRankerPrompt`, which incurs high API costs.
- **New Approach:** Filter all jobs once per day with a standardized, detailed prompt, store the results (scores and tags), and personalize them locally for each user using their preferences.
- **AI Knowledge:** The AI has access to your codebase and understands the existing structure, including models, functions, and workflows.

### Instructions

1. **Daily Comprehensive Job Filtering**

   - Create a new function (e.g., `filterJobsOnceDaily`) to run once daily.
   - Use a single, detailed OpenAI prompt to evaluate all 1,300 jobs against a broad set of criteria that encompasses common user preferences.
   - The prompt should return structured JSON output for each job, including:
     - A `scores` object with numeric values for various criteria (e.g., `"entryLevel": 4`, `"requiresDegree": -2`).
     - A `tags` array with descriptive labels (e.g., `["entryLevel", "tech"]`).
   - Store the results in the `jobs` table, adding new fields like `scores` (JSON) and `tags` (string array) if needed, without disrupting existing data.

   **Sample Prompt Idea:**

   ```
   Evaluate the following job listing based on a wide range of criteria. Return a JSON object with scores and tags. Assign positive scores for desirable traits (e.g., entry-level, specific skills) and negative scores for undesirable traits (e.g., required degree, years of experience). Include tags for key characteristics.
   ```

2. **Preserve Existing Functions**

   - **Do not delete or overwrite** any existing functions, such as per-user filtering logic.
   - Integrate the new filtering approach alongside the old one, allowing both to coexist.
   - If conflicts arise (e.g., duplicate processing or logic overlap), explore creative solutions like:
     - Adding a configuration flag to toggle between old and new methods.
     - Wrapping both approaches in a higher-level function that selects the active method dynamically.

3. **Local Personalization**

   - Create a new function (e.g., `getPersonalizedJobs`) to personalize job recommendations locally:
     - Retrieve the user’s `jobRankerPrompt` from their profile.
     - Parse the prompt to identify user-specific preferences or weights (e.g., prioritizing entry-level jobs).
     - Fetch pre-filtered jobs from the database.
     - Compute a personalized score for each job by combining the stored `scores` with user preferences.
     - Sort and return the jobs based on these scores.
   - Feel free to design the scoring logic creatively, such as using weighted sums or custom formulas.

4. **Handling Conflicts**

   - When new logic overlaps with existing functions, implement innovative workarounds:
     - Use feature flags or environment variables to switch between implementations.
     - Run both old and new methods in parallel temporarily, logging results for comparison.
     - Merge outputs from both systems if appropriate, prioritizing the new approach where possible.
   - For database changes (e.g., adding `scores` and `tags`), use migrations to extend the schema safely without affecting existing fields.

5. **Testing and Validation**

   - Add a lightweight test mechanism to compare the new approach with the old one:
     - Run both methods on a small subset of jobs and users.
     - Log differences in recommendations to ensure accuracy and refine as needed.
   - Adjust the comprehensive prompt or personalization logic based on test outcomes.

6. **Flexibility for the AI**
   - You have freedom to:
     - Design the structure of the OpenAI prompt and JSON output.
     - Choose how to parse user prompts and calculate personalized scores.
     - Optimize performance (e.g., caching user preferences or pre-filtered job data).
   - Adapt the implementation to fit seamlessly into the existing codebase, leveraging your understanding of its structure.

### Deliverables

- A new daily filtering function that uses a comprehensive OpenAI prompt.
- An updated `jobs` model with fields for storing scores and tags.
- A personalization function that tailors pre-filtered jobs to user preferences.
- A mechanism (e.g., flag or wrapper) to manage old and new filtering methods.
- A basic test function to validate the new approach against the existing one.

### Constraints

- **Preservation:** No existing functions should be deleted or overwritten.
- **Cost-Effectiveness:** Minimize OpenAI API calls by filtering jobs once daily.
- **Scalability:** Ensure the system can handle 1,300 jobs and multiple users efficiently.
- **Accuracy:** Maintain or improve the quality of job recommendations.

### Notes

- Use your knowledge of the codebase to make informed decisions about implementation details.
- If you encounter challenges (e.g., prompt design or schema changes), propose solutions that align with the project’s goals.
- Feel free to experiment with scoring algorithms or data storage formats to optimize performance and usability.
