"""
Mock research data for offline pipeline testing.
Used when --mock flag is passed to pipeline.py, or when APIs are unavailable.
"""

from research import ResearchBrief

MOCK_BRIEFS = {
    "ch1": {
        "Dunning-Kruger effect": ResearchBrief(
            topic="Dunning-Kruger effect",
            key_facts=[
                "The Dunning-Kruger effect is a cognitive bias where people with limited knowledge overestimate their competence.",
                "David Dunning and Justin Kruger published their original study in 1999 in the Journal of Personality and Social Psychology.",
                "The study found that participants scoring in the bottom quartile (12th percentile) estimated their performance at the 62nd percentile.",
                "Neuroscientific studies show reduced metacognitive activity in the prefrontal cortex correlates with overconfidence.",
                "A 2020 meta-analysis of 33 studies confirmed the effect across cultures and domains.",
                "High performers show the opposite bias: they underestimate their ability relative to peers.",
                "The effect is amplified under time pressure, reducing self-assessment accuracy by up to 40%.",
                "Dopamine signalling in the ventral striatum reinforces confident decisions regardless of actual accuracy.",
            ],
            specific_numbers=[
                "Participants scoring in the bottom quartile (12th percentile) estimated their performance at the 62nd percentile.",
                "A 2020 meta-analysis of 33 studies confirmed the effect.",
                "Self-assessment accuracy reduces by up to 40% under time pressure.",
            ],
            named_entities=["David Dunning", "Justin Kruger", "Cornell University", "Journal of Personality"],
            sources=["https://en.wikipedia.org/wiki/Dunning%E2%80%93Kruger_effect"],
        )
    },
    "ch6": {
        "Mars dust storms": ResearchBrief(
            topic="Mars dust storms planet-wide",
            key_facts=[
                "Global dust storms on Mars can engulf the entire planet, reducing sunlight by 99% in affected regions.",
                "The 2018 global dust storm lasted approximately 8 months and caused the Opportunity rover to permanently lose power.",
                "Mars dust particles are approximately 1.5 micrometres in diameter.",
                "Surface winds on Mars can reach 97 km/h during global storm season.",
                "NASA's Mars Reconnaissance Orbiter detected the 2018 storm growing from regional to global in just 4 days.",
                "Dust storms on Mars can raise temperatures in the upper atmosphere by up to 30 degrees C.",
                "The Martian dust storm season peaks near perihelion, when Mars is 206.7 million km from the Sun.",
                "The InSight lander recorded 1,100 individual dust devils in its first Martian year.",
            ],
            specific_numbers=[
                "Global dust storms reduce sunlight by 99%.",
                "The 2018 storm lasted approximately 8 months.",
                "Dust particles are approximately 1.5 micrometres in diameter.",
                "Surface winds can reach 97 km/h.",
                "Mars is 206.7 million km from the Sun at perihelion.",
            ],
            named_entities=["Mars", "Opportunity", "NASA", "Mars Reconnaissance Orbiter", "InSight"],
            sources=["https://en.wikipedia.org/wiki/Dust_storm_on_Mars"],
        )
    },
}


def get_mock_brief(topic: str, channel_id: str) -> ResearchBrief:
    channel_briefs = MOCK_BRIEFS.get(channel_id, {})
    if topic in channel_briefs:
        return channel_briefs[topic]
    if channel_briefs:
        return next(iter(channel_briefs.values()))
    return ResearchBrief(
        topic=topic,
        key_facts=[
            f"The {topic} is a well-documented phenomenon studied since the early 20th century.",
            f"Research shows {topic} affects approximately 68% of individuals at some point.",
            f"A landmark 1998 study by Professor James Harrison at MIT first quantified the effect at 2.4x baseline.",
            f"Brain imaging reveals the prefrontal cortex shows 40% reduced activity during {topic}.",
            f"The effect was replicated across 47 independent studies between 2000 and 2020.",
        ],
        specific_numbers=[
            f"Affects approximately 68% of individuals.",
            f"Effect quantified at 2.4x baseline in 1998.",
            f"Replicated across 47 independent studies.",
        ],
        named_entities=["James Harrison", "MIT", "prefrontal cortex"],
        sources=[f"https://en.wikipedia.org/wiki/{topic.replace(' ', '_')}"],
    )
