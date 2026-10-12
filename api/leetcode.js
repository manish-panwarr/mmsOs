/**
 * Serverless Proxy for LeetCode GraphQL API
 * Compatible with Vercel / Netlify / Node.js serverless functions.
 * Resolves CORS blocks and proxies real metrics for user 'g7pE7qxNks'.
 */

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  const username = req.query?.username || 'g7pE7qxNks';

  const GRAPHQL_QUERY = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
        profile {
          ranking
        }
        userCalendar {
          submissionCalendar
          streak
          totalActiveDays
        }
      }
    }
  `;

  try {
    const lcRes = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        query: GRAPHQL_QUERY,
        variables: { username }
      })
    });

    if (!lcRes.ok) {
      return res.status(lcRes.status).json({ error: `LeetCode upstream error: ${lcRes.statusText}` });
    }

    const raw = await lcRes.json();
    const matched = raw?.data?.matchedUser;

    if (!matched) {
      return res.status(404).json({ error: 'LeetCode user not found' });
    }

    const acNums = matched.submitStatsGlobal?.acSubmissionNum || [];
    const total = acNums.find(a => a.difficulty === 'All')?.count ?? 0;
    const easy = acNums.find(a => a.difficulty === 'Easy')?.count ?? 0;
    const medium = acNums.find(a => a.difficulty === 'Medium')?.count ?? 0;
    const hard = acNums.find(a => a.difficulty === 'Hard')?.count ?? 0;

    const ranking = matched.profile?.ranking ?? 0;
    const calendarData = matched.userCalendar || {};
    const streak = calendarData.streak ?? 0;
    const activeDays = calendarData.totalActiveDays ?? 0;
    let calendar = {};
    if (typeof calendarData.submissionCalendar === 'string') {
      try {
        calendar = JSON.parse(calendarData.submissionCalendar);
      } catch {
        calendar = {};
      }
    } else if (typeof calendarData.submissionCalendar === 'object') {
      calendar = calendarData.submissionCalendar || {};
    }

    const payload = {
      total,
      easy,
      medium,
      hard,
      ranking,
      activeDays,
      streak,
      calendar
    };

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(payload);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal serverless proxy error' });
  }
}
