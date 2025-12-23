# backend/app/utils/ai_agent.py
"""
Enhanced AI Agent for Mentee Intake
"""
import re
from typing import Dict, List, Tuple, Optional
from datetime import datetime


class EnhancedIntakeAgent:
    """
    Enhanced AI agent for mentee intake with:
    - Smart keyword extraction
    - Context-aware follow-ups
    - Dynamic conversation flow
    - Better data structuring
    """
    
    def __init__(self):
        self.conversation_state = {}
        self.extracted_data = {}
    
    CONVERSATION_FLOW = [
        {
            "step": 0,
            "type": "welcome",
            "question": "Hi! 👋 I'm your AI Mentorship Assistant. I'll help you find the perfect mentor by understanding your goals and needs.\n\nLet's start: Where are you in your career journey?\n\n💡 Choose one:\n• Student or recent graduate\n• Early career (0-3 years)\n• Mid-level professional (4-8 years)\n• Senior professional (8+ years)\n• Changing careers",
            "keywords": {
                "student": "student",
                "graduate": "student",
                "college": "student",
                "university": "student",
                "early": "early_career",
                "junior": "early_career",
                "new": "early_career",
                "0-3": "early_career",
                "mid": "mid_level",
                "intermediate": "mid_level",
                "4-8": "mid_level",
                "senior": "senior",
                "experienced": "senior",
                "8+": "senior",
                "change": "career_change",
                "transition": "career_change",
                "switch": "career_change"
            }
        },
        {
            "step": 1,
            "type": "primary_goal",
            "question": "Great! Now, what's driving you to seek a mentor? What's your main goal?\n\n🎯 Common goals:\n• Learn specific skills or technologies\n• Transition to a new role or industry\n• Develop leadership & management skills\n• Start or grow a business\n• Get career guidance & direction\n\nTell me what resonates with you:",
            "keywords": {
                "skill": "skill_development",
                "learn": "skill_development",
                "technology": "skill_development",
                "develop": "skill_development",
                "transition": "career_transition",
                "change": "career_transition",
                "switch": "career_transition",
                "new role": "career_transition",
                "leadership": "leadership",
                "manage": "leadership",
                "team": "leadership",
                "business": "entrepreneurship",
                "startup": "entrepreneurship",
                "entrepreneur": "entrepreneurship",
                "guidance": "career_guidance",
                "direction": "career_guidance"
            }
        },
        {
            "step": 2,
            "type": "specific_goal",
            "question": "Perfect! Let's make this more concrete.\n\n🎯 In your own words, what specific outcome do you want to achieve in the next 6-12 months?\n\nExample: 'Become a senior software engineer' or 'Launch my SaaS product' or 'Get promoted to team lead'",
            "extract_pattern": None
        },
        {
            "step": 3,
            "type": "current_challenges",
            "question": "Thanks for sharing! Now, what's currently blocking you or slowing you down?\n\n🚧 Common challenges:\n• Don't know where to start\n• Lack specific skills or knowledge\n• No network or connections\n• Confidence or imposter syndrome\n• Work-life balance issues\n\nWhat's your biggest obstacle?",
            "extract_pattern": None
        },
        {
            "step": 4,
            "type": "desired_skills",
            "question": "Got it! What specific skills or expertise do you want to develop?\n\n💡 Be specific - examples:\n• Python, Machine Learning, Data Analysis\n• Product Management, Roadmapping\n• Public Speaking, Networking\n• Financial Planning, Fundraising\n\nList 2-5 skills you want to master:",
            "extract_skills": True
        },
        {
            "step": 5,
            "type": "current_skills",
            "question": "Excellent! Now, what's your current level with these skills?\n\n📊 For example:\n• 'Beginner in Python, intermediate in Excel'\n• 'No experience in public speaking'\n• 'Advanced in coding, new to leadership'\n\nThis helps me match you with the right mentor level:",
            "extract_pattern": None
        },
        {
            "step": 6,
            "type": "industry",
            "question": "Which industry or domain are you focused on?\n\n🏢 Examples:\n• Software Engineering / Tech\n• Marketing / Growth\n• Finance / Consulting\n• Design / Creative\n• Healthcare / Biotech\n• Product Management\n• Entrepreneurship / Startups\n\nYour target industry:",
            "keywords": {
                "software": "Software Engineering",
                "tech": "Technology",
                "engineer": "Engineering",
                "marketing": "Marketing",
                "growth": "Growth/Marketing",
                "finance": "Finance",
                "consulting": "Consulting",
                "design": "Design",
                "creative": "Creative",
                "healthcare": "Healthcare",
                "biotech": "Biotech",
                "product": "Product Management",
                "entrepreneur": "Entrepreneurship",
                "startup": "Startups",
                "business": "Business"
            }
        },
        {
            "step": 7,
            "type": "time_commitment",
            "question": "How much time can you realistically commit to mentorship each week?\n\n⏰ Options:\n• 1 hour/week (monthly deep-dive sessions)\n• 2-3 hours/week (bi-weekly + async chat)\n• 4+ hours/week (weekly sessions + projects)\n• Flexible (varies based on needs)\n\nYour availability:",
            "keywords": {
                "1": "1hr/week",
                "one": "1hr/week",
                "2": "2-3hrs/week",
                "3": "2-3hrs/week",
                "two": "2-3hrs/week",
                "three": "2-3hrs/week",
                "4": "4+hrs/week",
                "four": "4+hrs/week",
                "flexible": "flexible",
                "varies": "flexible"
            }
        },
        {
            "step": 8,
            "type": "budget",
            "question": "What's your budget for mentorship?\n\n💰 Typical ranges:\n• Free or volunteer mentors only\n• $0-50/hour (early-career mentors)\n• $50-100/hour (experienced mentors)\n• $100+/hour (senior experts)\n\nBe honest - this helps me find sustainable matches:",
            "keywords": {
                "free": "free",
                "volunteer": "free",
                "0": "0-50",
                "50": "50-100",
                "100": "100+"
            }
        },
        {
            "step": 9,
            "type": "timeline",
            "question": "What's your timeline for achieving your goal?\n\n📅 Realistic timeframes:\n• 3 months (short-term, focused)\n• 6 months (balanced progress)\n• 12+ months (long-term transformation)\n\nYour timeline:",
            "keywords": {
                "3": "3_months",
                "three": "3_months",
                "6": "6_months",
                "six": "6_months",
                "12": "12_months",
                "year": "12_months"
            }
        },
        {
            "step": 10,
            "type": "mentor_style",
            "question": "Almost done! What mentoring style works best for you?\n\n👥 Styles:\n• **Hands-on Coach**: Regular tasks, code reviews, direct feedback\n• **Strategic Advisor**: Big-picture guidance, monthly check-ins\n• **Accountability Partner**: Goal-setting, progress tracking\n• **Project-based**: Work on real projects together\n\nYour preference:",
            "keywords": {
                "hands": "hands_on",
                "coach": "hands_on",
                "task": "hands_on",
                "advisor": "advisory",
                "strategic": "advisory",
                "guidance": "advisory",
                "accountability": "accountability",
                "partner": "accountability",
                "project": "project_based"
            }
        },
        {
            "step": 11,
            "type": "communication",
            "question": "Last question! How do you prefer to communicate?\n\n📱 Options:\n• Video calls (Zoom, Google Meet)\n• Text/Chat (Slack, Discord)\n• Both (mix of video + async chat)\n\nYour preference:",
            "keywords": {
                "video": "video",
                "zoom": "video",
                "call": "video",
                "text": "chat",
                "chat": "chat",
                "slack": "chat",
                "both": "both",
                "mix": "both"
            }
        }
    ]
    
    def extract_keywords(self, text: str, keywords_map: Dict[str, str]) -> Optional[str]:
        """Extract structured value from text using keyword matching"""
        text_lower = text.lower()
        for keyword, value in keywords_map.items():
            if keyword in text_lower:
                return value
        return None
    
    def extract_skills(self, text: str) -> List[str]:
        """Extract skill list from text"""
        text = re.sub(r'\b(and|or|also|want|to|learn|develop|improve)\b', '', text, flags=re.IGNORECASE)
        skills = re.split(r'[,\n•\-]', text)
        skills = [s.strip().title() for s in skills if len(s.strip()) > 2]
        return skills[:5]
    
    def get_contextual_followup(self, step: int, user_input: str) -> Optional[str]:
        """Generate contextual follow-up questions"""
        user_input_lower = user_input.lower()
        
        if step == 1:
            if "student" in user_input_lower and len(user_input.split()) < 5:
                return "Are you looking to prepare for your first job, or exploring different career paths?"
        
        if step == 2:
            if len(user_input.split()) < 10:
                return "Can you tell me a bit more? What would success look like for you?"
        
        if step == 4:
            if len(user_input.split()) < 3:
                return "That's a great start! Any other skills that would help you reach your goal?"
        
        return None
    
    def parse_response(self, step: int, user_input: str) -> Dict[str, any]:
        """Parse user response and extract structured data"""
        if step >= len(self.CONVERSATION_FLOW):
            return {}
        
        current_question = self.CONVERSATION_FLOW[step]
        question_type = current_question.get("type")
        result = {"raw_input": user_input}
        
        if "keywords" in current_question:
            extracted = self.extract_keywords(user_input, current_question["keywords"])
            if extracted:
                result[question_type] = extracted
            else:
                result[question_type] = user_input.strip()
        
        elif current_question.get("extract_skills"):
            skills = self.extract_skills(user_input)
            result["desired_skills"] = ", ".join(skills)
            result["skills_list"] = skills
        
        else:
            result[question_type] = user_input.strip()
        
        followup = self.get_contextual_followup(step, user_input)
        if followup:
            result["followup_question"] = followup
        
        return result
    
    def get_next_question(self, step: int) -> Optional[Dict]:
        """Get next question in the flow"""
        if step >= len(self.CONVERSATION_FLOW):
            return None
        return self.CONVERSATION_FLOW[step]
    
    def generate_summary(self, extracted_data: Dict) -> str:
        """Generate human-readable summary of conversation"""
        summary_parts = []
        
        if "career_stage" in extracted_data:
            summary_parts.append(f"Career stage: {extracted_data['career_stage']}")
        
        if "specific_goal" in extracted_data:
            summary_parts.append(f"Goal: {extracted_data['specific_goal']}")
        
        if "desired_skills" in extracted_data:
            summary_parts.append(f"Skills to develop: {extracted_data['desired_skills']}")
        
        if "industry_interest" in extracted_data:
            summary_parts.append(f"Industry: {extracted_data['industry_interest']}")
        
        return " | ".join(summary_parts)


def calculate_enhanced_match_score(intake, mentor) -> Tuple[int, List[str], Dict]:
    """
    Enhanced matching algorithm with multiple factors.
    Returns: (score, reasons, metadata)
    """
    score = 0
    reasons = []
    metadata = {
        "skill_overlap": [],
        "domain_match": False,
        "experience_fit": False,
        "budget_compatible": False
    }
    
    # 1. Skills match (35 points max)
    desired_skills = [s.strip().lower() for s in (intake.desired_skills or "").split(",")]
    mentor_skills = [s.strip().lower() for s in (mentor.skills or "").split(",")]
    
    exact_matches = [skill for skill in desired_skills if skill in mentor_skills]
    
    partial_matches = []
    for desired in desired_skills:
        for mentor_skill in mentor_skills:
            if desired in mentor_skill or mentor_skill in desired:
                if desired not in exact_matches:
                    partial_matches.append(desired)
    
    skill_score = min(35, len(exact_matches) * 12 + len(partial_matches) * 6)
    score += skill_score
    
    if exact_matches:
        metadata["skill_overlap"] = exact_matches
        reasons.append(f"✓ Expert in {', '.join(exact_matches[:3])}")
    
    # 2. Domain/Industry match (25 points max)
    if intake.industry_interest:
        industry_keywords = intake.industry_interest.lower().split()
        mentor_domains_lower = (mentor.domains or "").lower()
        mentor_bio_lower = (mentor.bio or "").lower()
        
        domain_match_count = sum(1 for keyword in industry_keywords 
                                 if keyword in mentor_domains_lower or keyword in mentor_bio_lower)
        
        if domain_match_count > 0:
            domain_score = min(25, domain_match_count * 10)
            score += domain_score
            metadata["domain_match"] = True
            reasons.append(f"✓ {intake.industry_interest} specialist")
    
    # 3. Experience level appropriateness (20 points max)
    experience_map = {
        "student": (1, 5),
        "early_career": (3, 10),
        "mid_level": (5, 15),
        "senior": (10, 30),
        "career_change": (5, 20)
    }
    
    exp_range = experience_map.get(intake.career_stage, (0, 30))
    mentor_exp = mentor.years_experience or 0
    
    if exp_range[0] <= mentor_exp <= exp_range[1]:
        score += 20
        metadata["experience_fit"] = True
        reasons.append(f"✓ {mentor_exp} years experience (perfect for your level)")
    elif mentor_exp > exp_range[1]:
        score += 10
        reasons.append(f"✓ Highly experienced ({mentor_exp} years)")
    
    # 4. Budget compatibility (12 points max)
    budget_ranges = {
        "free": (0, 0),
        "0-50": (0, 50),
        "50-100": (50, 100),
        "100+": (100, 10000)
    }
    
    budget_range = budget_ranges.get(intake.budget_range, (0, 10000))
    mentor_rate = mentor.hourly_rate or 0
    
    if budget_range[0] <= mentor_rate <= budget_range[1]:
        score += 12
        metadata["budget_compatible"] = True
        if mentor_rate == 0:
            reasons.append(f"✓ Offers free mentorship")
        else:
            reasons.append(f"✓ Within budget (${mentor_rate}/hr)")
    elif mentor_rate < budget_range[0]:
        score += 6
    
    # 5. Verification & credibility (8 points)
    if mentor.is_verified:
        score += 8
        reasons.append("✓ Verified mentor ✓")
    
    # 6. Bonus: Goal alignment from bio analysis (10 points)
    goal_keywords = {
        "skill_development": ["teach", "train", "mentor", "coach"],
        "career_transition": ["transition", "change", "pivot", "switch"],
        "leadership": ["lead", "manage", "team", "executive"],
        "entrepreneurship": ["startup", "business", "founder", "entrepreneur"]
    }
    
    if intake.primary_goal and mentor.bio:
        relevant_keywords = goal_keywords.get(intake.primary_goal, [])
        bio_lower = mentor.bio.lower()
        if any(kw in bio_lower for kw in relevant_keywords):
            score += 10
            reasons.append(f"✓ Specializes in {intake.primary_goal.replace('_', ' ')}")
    
    score = min(100, score)
    
    if score < 25:
        reasons.append("ℹ️ Limited match - consider browsing more mentors")
    
    return score, reasons, metadata