from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
from typing import Optional

from db.mongodb_client import UserModel, TenantModel

router = APIRouter()
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Pydantic models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    tenant_name: str
    role: str = "employee"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    tenant_id: str
    role: str

# Password utilities
def verify_password(plain_password, hashed_password):
    # Truncate password to 72 bytes for bcrypt compatibility (same as hashing)
    if len(plain_password.encode('utf-8')) > 72:
        plain_password = plain_password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    # Truncate password to 72 bytes for bcrypt compatibility
    if len(password.encode('utf-8')) > 72:
        password = password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.hash(password)

# JWT utilities
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = UserModel.get_user_by_id(user_id)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: dict = Depends(get_current_user)):
    return current_user

def require_role(required_roles: list):
    def role_checker(current_user: dict = Depends(get_current_active_user)):
        if current_user["role"] not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

@router.post("/register", response_model=Token)
async def register(user: UserCreate):
    # Check if user already exists
    existing_user = UserModel.get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if tenant exists, create if not
    tenant = TenantModel.get_tenant_by_name(user.tenant_name)
    if not tenant:
        tenant_data = {
            "name": user.tenant_name,
            "settings": {}
        }
        tenant_id = TenantModel.create_tenant(tenant_data)
        # First user of new tenant becomes admin
        user_role = "admin"
    else:
        tenant_id = str(tenant["_id"])
        user_role = user.role
    
    # Create user
    hashed_password = get_password_hash(user.password)
    user_data = {
        "email": user.email,
        "hashed_password": hashed_password,
        "full_name": user.full_name,
        "tenant_id": tenant_id,
        "role": user_role,
        "is_active": True
    }
    
    user_id = UserModel.create_user(user_data)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_id}, expires_delta=access_token_expires
    )
    
    user_response = {
        "id": user_id,
        "email": user.email,
        "full_name": user.full_name,
        "tenant_id": tenant_id,
        "role": user_role
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    user = UserModel.get_user_by_email(user_credentials.email)
    if not user or not verify_password(user_credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user["_id"])}, expires_delta=access_token_expires
    )
    
    user_response = {
        "id": str(user["_id"]),
        "email": user["email"],
        "full_name": user["full_name"],
        "tenant_id": user["tenant_id"],
        "role": user["role"]
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: dict = Depends(get_current_active_user)):
    return {
        "id": str(current_user["_id"]),
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "tenant_id": current_user["tenant_id"],
        "role": current_user["role"]
    }

@router.get("/users")
async def get_tenant_users(current_user: dict = Depends(require_role(["admin"]))):
    users = UserModel.get_users_by_tenant(current_user["tenant_id"])
    return [
        {
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "is_active": user.get("is_active", True),
            "created_at": user["created_at"]
        }
        for user in users
    ]