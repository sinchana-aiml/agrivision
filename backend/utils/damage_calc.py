"""
Crop damage estimation and PMFBY financial payout calculators.
"""

def calculate_pmfby_payout(damage_percentage):
    """
    Calculate Government PMFBY (Pradhan Mantri Fasal Bima Yojana) insurance payout
    based on the damage percentage.
    
    Tier System:
    - Damage >= 80%: ₹50,000 max compensation (Severe loss)
    - Damage >= 50%: ₹30,000 compensation (High loss)
    - Damage >= 30%: ₹15,000 compensation (Moderate loss)
    - Damage < 30%: ₹0 (Below deductible threshold)
    
    Args:
        damage_percentage (float): Estimated damage percentage of the crop (0.0 to 100.0).
        
    Returns:
        int: Approved sanction amount in Indian Rupees (₹).
    """
    if damage_percentage >= 80.0:
        return 50000
    elif damage_percentage >= 50.0:
        return 30000
    elif damage_percentage >= 30.0:
        return 15000
    else:
        return 0

def format_percentage(value, decimals=2):
    """Format floats to standard percentage representation."""
    return round(float(value), decimals)
