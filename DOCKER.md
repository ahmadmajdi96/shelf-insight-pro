# ShelfVision Docker Deployment

## Quick Start

### Prerequisites
- Docker and Docker Compose installed on your server
- Node.js 20+ (for local development)

### Build and Run

1. **Build and start the container:**
   ```bash
   docker-compose up -d --build
   ```

2. **Access the application:**
   Open your browser and navigate to: `http://your-server-ip:8765`

3. **View logs:**
   ```bash
   docker-compose logs -f shelfvision
   ```

4. **Stop the application:**
   ```bash
   docker-compose down
   ```

### Environment Variables

Before building, ensure your `.env` file contains the required Supabase configuration:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Your Supabase anon/public key

### Production Considerations

1. **SSL/TLS**: For production, consider placing a reverse proxy (like Traefik or nginx) in front with SSL certificates.

2. **Scaling**: The container can be scaled horizontally behind a load balancer.

3. **Updates**: To update the application:
   ```bash
   git pull
   docker-compose up -d --build
   ```

### Troubleshooting

- **Container won't start**: Check logs with `docker-compose logs`
- **Port conflict**: Change the port mapping in `docker-compose.yml` (e.g., `9000:80`)
- **Health check failing**: Ensure nginx is running correctly inside the container

### Manual Docker Build (without Compose)

```bash
# Build the image
docker build -t shelfvision:latest .

# Run the container
docker run -d -p 8765:80 --name shelfvision shelfvision:latest
```
