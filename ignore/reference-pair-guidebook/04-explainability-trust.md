# Explainability + Trust

> **Source**: [People + AI Guidebook](https://pair.withgoogle.com/chapter/explainability-trust/)  
> **License**: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License  
> **Copyright**: People + AI Research team at Google

## Overview

Explaining predictions, recommendations, and other AI output to users is critical for building trust.

This chapter covers:

- How much should the user trust the AI system?
- When should we provide explanations?
- What should we do if we can't show why the AI made a given prediction?
- How should we show users the confidence associated with an AI prediction?

## What's new when working with AI

Because AI-powered systems are based on probability and uncertainty, the right level of explanation is key to helping users understand how the system works. Once users have clear mental models of the system's capabilities and limits, they can understand how and when to trust it.

Key considerations:

**➀ Help users calibrate their trust.** The user shouldn't trust the system completely. Rather, based on system explanations, the user should know when to trust the system's predictions and when to apply their own judgement.

**➁ Plan for trust calibration throughout the product experience.** Establishing the right level of trust takes time. AI can change and adapt over time, and so will the user's relationship with the product.

**➂ Optimize for understanding.** In some cases, there may be no explicit, comprehensive explanation for the output of a complex algorithm.

**➃ Manage influence on user decisions.** AI systems often generate output that the user needs to act on. If, when, and how the system calculates and shows confidence levels can be critical.

## Identify what goes into user trust

Trust is the willingness to take a risk based on the expectation of a benefit.

The following factors contribute to user trust:

- **Ability** is a product's competence to get the job done
- **Reliability** indicates how consistently your product delivers on its abilities
- **Benevolence** is the belief that the trusted party wants to do good for the user

The process to earn user trust is slow, and it'll require proper calibration of the user's expectations and understanding of what the product can and can't do.

## ➀ Help users calibrate their trust

Users shouldn't implicitly trust your AI system in all circumstances, but rather calibrate their trust correctly. Ideally, users have the appropriate level of trust given what the system can and cannot do.

### Articulate data sources

Every AI prediction is based on data, so data sources have to be part of your explanations. Sometimes users can be surprised by their own information when they see it in a new context.

Whenever possible, the AI system should explain:

- **Scope**: Show an overview of the data being collected about an individual user
- **Reach**: Explain whether the system is personalized to one user or using aggregated data
- **Removal**: Tell users whether they can remove or reset some of the data being used

### Tie explanations to user actions

People learn faster when they can see a response to their actions right away. The perfect time to show explanations is in response to a user's action.

### Account for situational stakes

You can use explanations to encourage users to trust an output more or less depending on the situation and potential consequences. It's important to consider the risks of a user trusting a false positive, false negative, or a prediction that's off by a certain percent.

### Key concept

As a team, brainstorm what kinds of interactions, results, and corresponding explanations would decrease, maintain, or inflate trust in your AI system. These should fall somewhere along a trust spectrum of "No trust" to "Too much trust".

## ➁ Calibrate trust throughout the product experience

The process to build the right level of trust with users is slow and deliberate, and it starts even before users' first interaction with the product.

There are various opportunities to help users set their expectations:

- **Explain in-the-moment**: When appropriate, provide reasons for a given inference
- **Provide additional explanations in the product**: Leverage other in-product moments, such as onboarding
- **Go beyond the product experience**: Support with marketing campaigns and educational materials

### Establish trust from the beginning

To start establishing trust with users before they begin to use the product:

- Communicate the product's capabilities and limitations clearly
- Highlight what's familiar
- Contextualize recommendations with third-party sources

### Grow trust early on

To build and calibrate users' trust as they get familiar with the AI product:

- Communicate privacy and security settings on user data
- Make it easy to try the product first
- Engage users and give them some control as they get started

### Maintain trust

To maintain trust with users as they continue using the product:

- Progressively increase automation under user guidance
- Continue to communicate clearly about permissions and settings

### Regain or prevent lost trust

To maintain trust with users as they run into errors:

- Communicate with appropriate responses
- Give users a way forward, according to the severity of possible outcomes

## ➂ Optimize for understanding

As described above, explanations are crucial for building calibrated trust. However, offering an explanation of an AI system can be a challenge in and of itself.

Often, the rationale behind a particular AI prediction is unknown or too complex to be summarized into a simple sentence. In many cases the best approach is not to attempt to explain everything – just the aspects that impact user trust and decision-making.

### Explain what's important

Partial explanations clarify a key element of how the system works or expose some of the data sources used for certain predictions. Partial explanations intentionally leave out parts of the system's function that are unknown, highly complex, or simply not useful.

### Describe the system or explain the output

**General system explanations** talk about how the whole system behaves, regardless of the specific input. They can explain the types of data used, what the system is optimizing for, and how the system was trained.

**Specific output explanations** should explain the rationale behind a specific output for a specific user. Output explanations are useful because they connect explanations directly to actions.

### Data sources

Simple models such as regressions can often surface which data sources had the greatest influence on the system output. Another way of explaining data sources is counterfactuals, which tell the user why the AI did not make a certain decision or prediction.

### Model confidence displays

Rather than stating why or how the AI came to a certain decision, model confidence displays explain how certain the AI is in its prediction, and the alternatives it considered.

Confidence displays help users gauge how much trust to put in the AI output. However, confidence can be displayed in many different ways, and statistical information like confidence scores can be challenging for users to understand.

### Example-based explanations

Example-based explanations are useful in cases where it's tricky to explain the reasons behind the AI's predictions. This approach gives users examples from the model's training set that are relevant to the decision being made.

### Explanation via interaction

Another way to explain the AI and help users build mental models is by letting users experiment with the AI on-the-fly, as a way of asking "what if?".

### Note special cases of absent or comprehensive explanation

In select cases, there's no benefit to including any kind of explanation in the user interface. If the way an AI works fits a common mental model and matches user expectations, then there may not be anything to explain.

In other situations, it makes sense, or is required by law, to give a complete explanation — one so detailed that a third party could replicate the results.

### Key concept

Think about how an explanation for each critical interaction could decrease, maintain, or increase trust. Then, decide which situations need explanations, and what kind.

## ➃ Manage influence on user decisions

One of the most exciting opportunities for AI is being able to help people make better decisions more often. For this kind of collaboration to be effective, people need to know if and when to trust a system's predictions.

Model confidence indicates how certain the system is in the accuracy of its results. Displaying model confidence can sometimes help users calibrate their trust and make better decisions, but it's not always actionable.

### Determine if you should show confidence

It's not easy to make model confidence intuitive. Be sure to set aside lots of time to test if showing model confidence is beneficial for your users and your product.

You might choose not to indicate model confidence if:

- The confidence level isn't impactful
- Showing confidence could create mistrust

### Decide how best to show model confidence

If your research confirms that displaying model confidence improves decision making, the next step is choosing an appropriate visualization. Types include:

**Categorical**: Categorize confidence values into buckets, such as High / Medium / Low

**N-best alternatives**: Display the N-best alternative results rather than an explicit indicator

**Numeric**: A simple percentage (risky because it presumes users understand probability)

**Data visualizations**: Graphic-based indications of certainty like error bars or shaded areas

### Key concept

To assess whether showing model confidence increases trust and makes it easier for people to make decisions, conduct user research. Example questions:

- "On this scale, show me how trusting you are of this recommendation."
- "What questions do you have about how the app came to this recommendation?"
- "What, if anything, would increase your trust in this recommendation?"

## Summary

If and how you offer explanations of the inner-workings of your AI system can profoundly influence the user's experience with your system and its usefulness in their decision-making.

---

_People + AI Guidebook by People + AI Research team is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. Based on a work at pair.withgoogle.com._
