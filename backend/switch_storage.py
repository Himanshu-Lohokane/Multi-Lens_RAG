#!/usr/bin/env python3
"""
Storage Provider Switcher
Easily switch between S3 and GCS storage providers
"""

import os
from pathlib import Path

def get_current_provider():
    """Get current storage provider from .env file"""
    env_file = Path(".env")
    if not env_file.exists():
        return None
    
    content = env_file.read_text()
    for line in content.split('\n'):
        if line.startswith('STORAGE_PROVIDER='):
            return line.split('=', 1)[1].strip()
    return None

def switch_to_provider(provider):
    """Switch to specified storage provider"""
    env_file = Path(".env")
    if not env_file.exists():
        print("❌ .env file not found!")
        return False
    
    content = env_file.read_text()
    lines = content.split('\n')
    
    # Update STORAGE_PROVIDER line
    updated = False
    for i, line in enumerate(lines):
        if line.startswith('STORAGE_PROVIDER='):
            lines[i] = f'STORAGE_PROVIDER={provider}'
            updated = True
            break
    
    if not updated:
        # Add STORAGE_PROVIDER if not found
        lines.insert(0, f'STORAGE_PROVIDER={provider}')
    
    # Write back to file
    env_file.write_text('\n'.join(lines))
    return True

def show_status():
    """Show current storage configuration status"""
    current = get_current_provider()
    
    print("📊 Current Storage Configuration")
    print("=" * 40)
    print(f"Current Provider: {current or 'Not set'}")
    print()
    
    # Check if required env vars are set
    env_file = Path(".env")
    if env_file.exists():
        content = env_file.read_text()
        
        # Check S3 config
        s3_vars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_BUCKET_NAME']
        s3_configured = all(f'{var}=' in content and not content.split(f'{var}=')[1].split('\n')[0].strip().startswith('#') for var in s3_vars)
        
        # Check GCS config
        gcs_vars = ['GCS_PROJECT_ID', 'GCS_BUCKET_NAME', 'GCS_SERVICE_ACCOUNT_KEY']
        gcs_configured = all(f'{var}=' in content and not content.split(f'{var}=')[1].split('\n')[0].strip().startswith('#') for var in gcs_vars)
        
        print("Configuration Status:")
        print(f"  S3:  {'✅ Configured' if s3_configured else '❌ Not configured'}")
        print(f"  GCS: {'✅ Configured' if gcs_configured else '❌ Not configured'}")
        print()
        
        if current == 's3' and not s3_configured:
            print("⚠️  Warning: S3 is selected but not properly configured!")
        elif current == 'gcs' and not gcs_configured:
            print("⚠️  Warning: GCS is selected but not properly configured!")

def main():
    """Main function"""
    print("🔄 Storage Provider Switcher")
    print("=" * 40)
    print()
    
    show_status()
    
    while True:
        print("\nChoose an option:")
        print("1. Switch to AWS S3")
        print("2. Switch to Google Cloud Storage (GCS)")
        print("3. Show current status")
        print("4. Exit")
        print()
        
        choice = input("Enter your choice (1-4): ").strip()
        
        if choice == "1":
            if switch_to_provider('s3'):
                print("✅ Switched to AWS S3")
                print("🔄 Restart your application for changes to take effect")
            else:
                print("❌ Failed to switch to S3")
                
        elif choice == "2":
            if switch_to_provider('gcs'):
                print("✅ Switched to Google Cloud Storage (GCS)")
                print("🔄 Restart your application for changes to take effect")
            else:
                print("❌ Failed to switch to GCS")
                
        elif choice == "3":
            show_status()
            
        elif choice == "4":
            print("👋 Goodbye!")
            break
            
        else:
            print("❌ Invalid choice. Please try again.")

if __name__ == "__main__":
    main()