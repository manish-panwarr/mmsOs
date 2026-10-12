/**
 * Cloudflare Pages / Worker Function for LeetCode API
 * Route: /api/leetcode
 */

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const username = url.searchParams.get('username') || 'g7pE7qxNks';

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

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
      return new Response(JSON.stringify({ error: `Upstream error: ${lcRes.statusText}` }), {
        status: lcRes.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const raw = await lcRes.json();
    const matched = raw?.data?.matchedUser;

    if (!matched) {
      return new Response(JSON.stringify({ error: 'LeetCode user not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
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

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Proxy error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
