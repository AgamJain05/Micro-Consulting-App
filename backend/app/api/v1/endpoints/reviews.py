from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from beanie import PydanticObjectId
from app.models.review import Review
from app.models.session import Session, SessionStatus
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewResponse
from app.api import deps

router = APIRouter()

@router.post("/", response_model=ReviewResponse)
async def create_review(
    review_in: ReviewCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    # 1. Get Session
    session = await Session.get(PydanticObjectId(review_in.session_id))
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # 2. Validate User (Must be the client)
    # Manual link fetch or check ID
    client_id = session.client.ref.id if hasattr(session.client, 'ref') else session.client.id
    
    if client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the client can leave a review")
        
    if session.status != SessionStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Can only review completed sessions")

    # 3. Check if already reviewed
    existing = await Review.find_one(Review.session.id == session.id)
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this session")
        
    # 4. Create Review
    consultant_id = session.consultant.ref.id if hasattr(session.consultant, 'ref') else session.consultant.id
    consultant = await User.get(consultant_id)
    
    review = Review(
        session=session,
        client=current_user,
        consultant=consultant,
        rating=review_in.rating,
        comment=review_in.comment
    )
    await review.create()
    
    # 5. Update Consultant Rating
    # Fetch all reviews for consultant to aggregate
    reviews = await Review.find(Review.consultant.id == consultant.id).to_list()
    total_rating = sum(r.rating for r in reviews)
    count = len(reviews)
    
    consultant.rating = total_rating / count if count > 0 else 5.0
    consultant.review_count = count
    await consultant.save()
    
    return ReviewResponse(
        id=str(review.id),
        rating=review.rating,
        comment=review.comment,
        client_name=f"{current_user.first_name} {current_user.last_name}",
        created_at=review.created_at
    )

@router.get("/consultant/{consultant_id}", response_model=List[ReviewResponse])
async def get_consultant_reviews(consultant_id: str) -> Any:
    reviews = await Review.find(Review.consultant.id == PydanticObjectId(consultant_id)).sort("-created_at").to_list()
    
    response = []
    for r in reviews:
        # Fetch client to get name
        client = await User.get(r.client.ref.id)
        client_name = f"{client.first_name} {client.last_name}" if client else "Anonymous"
        
        response.append(ReviewResponse(
            id=str(r.id),
            rating=r.rating,
            comment=r.comment,
            client_name=client_name,
            created_at=r.created_at
        ))
        
    return response

