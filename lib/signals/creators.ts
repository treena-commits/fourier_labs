import { TrendInput, SignalResult } from '@/lib/types'

interface YouTubeVideo {
  title: string
  channelTitle: string
  publishedAt: string
  viewCount: number
  likeCount: number
  videoId: string
}

interface InstagramMention {
  title: string
  link: string
  snippet: string
  date?: string
}

function buildCreatorKeyword(input: TrendInput): string {
  const fabric = input.fabric.toLowerCase()
  if (fabric.includes('linen')) return 'linen co-ord set'
  if (fabric.includes('cotton')) return 'cotton co-ord set'
  if (fabric.includes('rayon') || fabric.includes('viscose')) return 'rayon co-ord set'
  return 'co-ord set women'
}

export async function fetchCreatorSignal(input: TrendInput): Promise<SignalResult & { raw_data: { youtube: YouTubeVideo[], instagram: InstagramMention[] } }> {
  const youtubeKey = process.env.YOUTUBE_API_KEY
  const serpApiKey = process.env.SERPAPI_KEY
  const keyword = buildCreatorKeyword(input)

  const youtubeVideos: YouTubeVideo[] = []
  const instagramMentions: InstagramMention[] = []

  // YouTube Data API v3
  if (youtubeKey) {
    try {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(keyword + ' India haul review 2025 2026')}&type=video&regionCode=IN&relevanceLanguage=en&maxResults=10&order=viewCount&key=${youtubeKey}`
      const searchRes = await fetch(searchUrl, { next: { revalidate: 3600 } })
      if (searchRes.ok) {
        const searchData = await searchRes.json()
        const videoIds = (searchData.items || []).map((v: { id: { videoId: string } }) => v.id.videoId).join(',')
        if (videoIds) {
          const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${youtubeKey}`
          const statsRes = await fetch(statsUrl, { next: { revalidate: 3600 } })
          if (statsRes.ok) {
            const statsData = await statsRes.json()
            for (const item of statsData.items || []) {
              youtubeVideos.push({
                title: item.snippet.title,
                channelTitle: item.snippet.channelTitle,
                publishedAt: item.snippet.publishedAt,
                viewCount: parseInt(item.statistics.viewCount || '0'),
                likeCount: parseInt(item.statistics.likeCount || '0'),
                videoId: item.id,
              })
            }
          }
        }
      }
    } catch {
      // continue
    }
  }

  // Google Search for Instagram mentions via SerpAPI
  if (serpApiKey) {
    try {
      const igUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(keyword + ' site:instagram.com OR site:reels')}&gl=in&hl=en&api_key=${serpApiKey}&num=10`
      const igRes = await fetch(igUrl, { next: { revalidate: 3600 } })
      if (igRes.ok) {
        const igData = await igRes.json()
        for (const result of (igData.organic_results || []).slice(0, 5)) {
          instagramMentions.push({
            title: result.title,
            link: result.link,
            snippet: result.snippet || '',
            date: result.date,
          })
        }
      }
    } catch {
      // continue
    }
  }

  if (youtubeVideos.length === 0 && instagramMentions.length === 0) {
    return {
      confidence: 'Insufficient Data',
      evidence_summary: 'No creator content found. Configure YOUTUBE_API_KEY and SERPAPI_KEY.',
      what_it_proves: 'Creator awareness and early adoption signal.',
      what_could_mislead: 'Views do not equal purchases; social buzz may not convert to value-fashion demand.',
      raw_data: { youtube: [], instagram: [] },
    }
  }

  const totalViews = youtubeVideos.reduce((s, v) => s + v.viewCount, 0)
  const recentVideos = youtubeVideos.filter(v => {
    const pub = new Date(v.publishedAt)
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - 6)
    return pub > cutoff
  })

  const confidence: SignalResult['confidence'] =
    recentVideos.length >= 3 && totalViews > 50000 ? 'High'
    : youtubeVideos.length >= 2 || instagramMentions.length >= 3 ? 'Medium'
    : 'Low'

  const topVideo = youtubeVideos[0]
  const summary = [
    youtubeVideos.length > 0 ? `${youtubeVideos.length} YouTube videos found (${recentVideos.length} in last 6 months). Top: "${topVideo?.title}" — ${topVideo?.viewCount?.toLocaleString()} views.` : '',
    instagramMentions.length > 0 ? `${instagramMentions.length} Instagram mentions via Google Search.` : '',
  ].filter(Boolean).join(' ')

  return {
    confidence,
    evidence_summary: summary || 'Sparse creator data.',
    what_it_proves: 'Creators are picking up and amplifying this style, signaling awareness and early adoption among fashion-forward consumers.',
    what_could_mislead: 'View counts do not equal purchase intent. Social buzz concentrated among premium/aspirational creators may not translate to value-fashion demand at ₹' + input.priceBand + '.',
    raw_data: { youtube: youtubeVideos, instagram: instagramMentions },
  }
}
