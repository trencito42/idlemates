# Deploying Xoda AI Chat Widget

## 🚀 Quick Start

### 1. Install and Setup Mistral Model
First, pull and setup the Mistral model for better AI responses:

```bash
# Pull Mistral model
ollama pull mistral

# Test the model
ollama run mistral "Hello, tell me about IdleMates pricing"
```

### 2. Update Pricing Cache
Populate Redis with current pricing from database:

```bash
# Navigate to project directory
cd /home/idlemat/htdocs/idlemat.es

# Update pricing cache from database
npx tsx scripts/update-pricing-cache.ts
```

### 3. Start Ollama Server
Make sure Ollama server is running:

```bash
ollama serve
```

### 4. Verify Setup
1. Visit your homepage at http://localhost:3699
2. Look for the purple chat button in the bottom-right corner
3. Click it to open the chat widget
4. Test with questions like:
   - "What are the pricing plans?"
   - "How do I start a session?"
   - "Is it safe?"

## 📱 Features

### ✅ What's Included
- **Live Text Streaming**: See each word as it's generated in real-time
- **English Only**: AI responds only in English for consistency
- **Topic Focused**: Refuses non-IdleMates discussions politely
- **Real Database Pricing**: Gets actual prices from your database via Redis
- **Mobile Optimized**: Fixed zoom issues and responsive design
- **Site Design Integration**: Matches your site's purple theme perfectly
- **Real-time Chat**: Instant streaming with Mistral AI model
- **Quick Responses**: Pre-defined buttons for common questions
- **Auto-resize Input**: Smart textarea that grows with content
- **Improved Mobile Experience**: Fullscreen on mobile, no zoom on input focus

### 🎨 Design Elements
- **Purple Theme**: Matches your site's accent colors perfectly
- **Mobile First**: Fullscreen chat on mobile devices
- **No Zoom Issues**: Prevents unwanted zoom on input focus
- **Better Typography**: Improved text wrapping and spacing
- **Responsive Layout**: Perfect on all screen sizes

### 🤖 AI Improvements
- **Mistral Model**: More intelligent and faster responses
- **English Only**: Consistent language experience
- **Focused Responses**: Only discusses IdleMates services
- **Real Pricing**: Uses actual prices from your database
- **Concise Answers**: No more overly long responses

## 🔧 Technical Details

### Components Updated
- `components/ChatWidget.tsx` - Enhanced mobile experience and streaming
- `app/api/chat/xoda/route.ts` - Mistral integration with database pricing
- `scripts/update-pricing-cache.ts` - Auto-sync pricing from DB to Redis

### Database Integration
- Fetches pricing from `Plan` table in database
- Caches in Redis for fast access (1 hour expiration)
- Auto-converts cents to euros for display
- Updates when you run the cache update script

### Mobile Optimizations
- Fixed zoom on input focus (fontSize: 16px)
- Better responsive layout
- Improved typing indicator
- Fullscreen experience on mobile
- Safe area padding support

### AI Configuration
- **Model**: Mistral (more intelligent than previous models)
- **Language**: English only responses
- **Topics**: Strictly IdleMates-related discussions
- **Pricing**: Real-time from database
- **Tone**: Professional but friendly

## 🛠 Troubleshooting

### If Chat Doesn't Respond
1. Check Ollama is running: `ollama serve`
2. Verify Mistral model: `ollama list | grep mistral`
3. Test model directly: `ollama run mistral "test"`

### If Pricing is Wrong
1. Update pricing cache: `npx tsx scripts/update-pricing-cache.ts`
2. Check Redis: `redis-cli get "plans:pricing"`
3. Verify database plans are correct

### If Mobile Issues Persist
1. Check viewport meta tag is set correctly
2. Test on actual devices, not just browser devtools
3. Clear browser cache and test again

### Common Issues
- **Port 11434**: Ollama default port must be accessible
- **Redis Connection**: Pricing cache requires Redis
- **Database Access**: Script needs database connection
- **Model Not Found**: Run `ollama pull mistral` if needed

## 🎯 Usage Tips

### For Best Results
1. Run pricing cache update when you change plans in admin
2. Set up automatic cache refresh (cron job recommended)
3. Monitor AI responses for quality
4. Test on multiple mobile devices

### Maintenance
- Update pricing cache when plans change
- Monitor Ollama performance and memory usage
- Check Redis memory usage for cache data
- Review AI responses periodically for quality

## 🚀 Deployment Ready

The chat widget is now production-ready with:

- ✅ **Mistral AI**: Advanced language model for better responses
- ✅ **English Only**: Consistent user experience
- ✅ **Real Database Pricing**: Always up-to-date pricing information
- ✅ **Mobile Optimized**: Perfect experience on all devices
- ✅ **Topic Focused**: Only discusses IdleMates services
- ✅ **Live Streaming**: Real-time word-by-word generation
- ✅ **Error Handling**: Graceful fallbacks and error messages

### Production Checklist
1. ✅ Mistral model installed and tested
2. ✅ Pricing cache populated from database  
3. ✅ Ollama server running and accessible
4. ✅ Redis connection working for cache
5. ✅ Mobile testing completed
6. ✅ English-only responses verified

Happy chatting with Xoda! 💬✨ Now with intelligent Mistral AI and real pricing!