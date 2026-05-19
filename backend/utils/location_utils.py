"""
Location processing and formatting utility helpers for AgriVision GIS mapping features.
"""

def format_coordinates(lat, lon):
    """
    Converts raw numeric/string coordinates to standard human-readable format.
    
    Args:
        lat (float/str): Latitude coordinates.
        lon (float/str): Longitude coordinates.
        
    Returns:
        str: Formatted geolocation string.
    """
    try:
        f_lat = round(float(lat), 4)
        f_lon = round(float(lon), 4)
        return f"Lat: {f_lat}, Lon: {f_lon}"
    except (ValueError, TypeError):
        return f"Lat: {lat}, Lon: {lon}"

def is_valid_coordinate(lat, lon):
    """
    Validate if latitude and longitude are within standard geographical limits.
    
    Args:
        lat (float/str): Latitude coordinates.
        lon (float/str): Longitude coordinates.
        
    Returns:
        bool: True if coordinates are valid, False otherwise.
    """
    try:
        f_lat = float(lat)
        f_lon = float(lon)
        return -90.0 <= f_lat <= 90.0 and -180.0 <= f_lon <= 180.0
    except (ValueError, TypeError):
        return False
