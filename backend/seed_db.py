import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.user import User, UserRole, AvailabilityStatus
from app.models.session import Session
from app.core.config import settings
from app.core.security import get_password_hash

# Fix for Windows Event Loop
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def seed_db():
    print(f"Connecting to database at {settings.MONGODB_URL}...")
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        await init_beanie(database=client[settings.DATABASE_NAME], document_models=[User, Session])
        print("Connected to MongoDB.")
    except Exception as e:
        print(f"Failed to connect to DB: {e}")
        return

    print("Seeding consultants...")
    
    # Ensure default client test user has credits
    test_client_email = "test_client@example.com"
    hashed_password = get_password_hash("password")
    
    client_user = await User.find_one(User.email == test_client_email)
    if not client_user:
        client_user = User(
            email=test_client_email,
            hashed_password=hashed_password,
            first_name="Test",
            last_name="Client",
            role=UserRole.CLIENT,
            credits=50.0 # Initial 50 credits
        )
        await client_user.create()
        print(f"Created test client: {test_client_email}")
    else:
        # Reset credits if needed
        if client_user.credits < 50.0:
            client_user.credits = 50.0
            await client_user.save()
            print(f"Reset credits for {test_client_email}")

    consultants = [
        {
            "email": "sarah@example.com",
            "first_name": "Sarah",
            "last_name": "Jenkins",
            "headline": "Senior React Engineer",
            "bio": "Ex-Meta frontend engineer specializing in performance optimization and design systems.",
            "skills": ["React", "TypeScript", "System Design", "Next.js"],
            "price_per_minute": 2.0, # $120/hr = $2/min
            "rating": 4.9,
            "review_count": 42,
            "category": "Development",
            "status": AvailabilityStatus.ONLINE,
            "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
        },
        {
            "email": "david@example.com",
            "first_name": "David",
            "last_name": "Chen",
            "headline": "Full Stack Python Developer",
            "bio": "Expert in FastAPI, Django, and AI integration. 10 years experience.",
            "skills": ["Python", "FastAPI", "AI/ML", "Django"],
            "price_per_minute": 2.5, # $150/hr
            "rating": 5.0,
            "review_count": 18,
            "category": "Development",
            "status": AvailabilityStatus.BUSY,
            "avatar_url": "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
        },
        {
            "email": "elena@example.com",
            "first_name": "Elena",
            "last_name": "Rodriguez",
            "headline": "UX/UI Director",
            "bio": "Helping startups find product-market fit through user-centric design.",
            "skills": ["Figma", "User Research", "Prototyping"],
            "price_per_minute": 1.5, # $90/hr
            "rating": 4.7,
            "review_count": 156,
            "category": "Design",
            "status": AvailabilityStatus.ONLINE,
            "avatar_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
        },
        {
            "email": "michael@example.com",
            "first_name": "Michael",
            "last_name": "Ross",
            "headline": "Startup Legal Counsel",
            "bio": "Specializing in IP, incorporation, and fundraising contracts for SaaS.",
            "skills": ["IP Law", "Contracts", "Fundraising"],
            "price_per_minute": 4.16, # ~$250/hr
            "rating": 4.8,
            "review_count": 30,
            "category": "Legal",
            "status": AvailabilityStatus.OFFLINE,
            "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
        }
    ]

    count = 0
    for data in consultants:
        user = await User.find_one(User.email == data["email"])
        if not user:
            user = User(
                hashed_password=hashed_password,
                role=UserRole.CONSULTANT,
                **data
            )
            await user.create()
            print(f"Created consultant: {data['first_name']} {data['last_name']}")
            count += 1
        else:
            # Update existing for testing UI changes
            updated = False
            for k, v in data.items():
                if k != "email":
                    # Handle Enum conversion if needed, though direct assign usually works with Beanie if type matches
                    if getattr(user, k) != v:
                        setattr(user, k, v)
                        updated = True
            
            # Ensure role is consultant
            if user.role != UserRole.CONSULTANT:
                user.role = UserRole.CONSULTANT
                updated = True

            if updated:
                await user.save()
                print(f"Updated consultant: {data['first_name']} {data['last_name']}")
            else:
                print(f"Skipped (up to date): {data['first_name']} {data['last_name']}")
            count += 1

    print(f"Seeding complete. Processed {count} consultants.")
    
    # Verify
    final_count = await User.find(User.role == UserRole.CONSULTANT).count()
    print(f"Total Consultants in DB: {final_count}")

if __name__ == "__main__":
    asyncio.run(seed_db())
