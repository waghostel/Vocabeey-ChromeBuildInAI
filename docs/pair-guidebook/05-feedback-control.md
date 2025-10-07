# Feedback + Control

> **Source**: [People + AI Guidebook](https://pair.withgoogle.com/chapter/feedback-controls/)  
> **License**: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License  
> **Copyright**: People + AI Research team at Google

## Overview

When users give feedback to AI products, it can greatly improve the AI performance and the user experience over time.

This chapter covers:

- How should the AI request and respond to user feedback?
- How can we ensure our AI can interpret and use both implicit and explicit user feedback?
- What's the right level of control and customization to give our users?

## What's new when working with AI

User feedback is the communication channel between your users, your product, and your team. Leveraging feedback is a powerful and scalable way to improve your technology, provide personalized content, and enhance the user experience.

For AI products, user feedback and control are critical to improving your underlying AI model's output and user experience.

Key considerations:

**➀ Align feedback with model improvement.** Clarify the differences between implicit and explicit feedback, and ask useful questions at the right level of detail.

**➁ Communicate value & time to impact.** Understand why people give feedback so you can set expectations for how and when it will improve their user experience.

**➂ Balance control & automation.** Give users control over certain aspects of the experience and allow them to easily opt out of giving feedback.

## ➀ Align feedback with model improvement

In general, there are implicit and explicit mechanisms for gathering feedback. For either type, it's important to let users know what information is being collected, what it's for, and how its use benefits them.

### Review implicit feedback

Implicit feedback is data about user behavior and interactions from your product logs. This can include valuable nuggets such as the times of day when users open your app, or the number of times they accept or reject your recommendations.

Often, this happens as part of regular product usage — you don't have to explicitly ask for this type of information, but you should let users know you're collecting it, and get their permission up front.

### Collect explicit feedback

Explicit feedback is when users deliberately provide commentary on output from your AI. Often, this is qualitative, like whether or not a recommendation was helpful, or if and how a categorization was wrong.

Explicit feedback can be used in two ways:

1. You or your team can review user feedback for themes and make changes to the product accordingly
2. It can be fed directly back into the AI model as a signal

The question and answer choices you provide should be easy for users to understand. In most cases, options for feedback responses should be mutually exclusive and collectively exhaustive.

### Interpret dual feedback

Sometimes a single piece of feedback contains both implicit and explicit signals at the same time. For example, public 'likes' are both a way to communicate with others (explicitly) and useful data to tune a recommendations model (implicitly).

### Design for model tuning

Ideally, what people want to give feedback on aligns with what data is useful to tune your model. However, that's not guaranteed. Find out what people expect to be able to influence by conducting user research.

### Key concept

List out as many events and corresponding feedback opportunities as possible that could provide data to improve the AI in your product. Then, systematically ask:

1. What user experience is triggering this feedback opportunity?
2. What kind of content are they providing feedback on?
3. Is this feedback implicit or explicit?

## ➁ Communicate value & time to impact

For people to take the time to give feedback, it needs to be valuable and impactful. How you communicate this is key to whether or not your users will engage.

### Understand why people give feedback

There are many reasons people choose to give feedback:

**Material rewards**: Cash payments are highly motivating but costly and may decrease feedback quality

**Symbolic rewards**: Status attainment, social proof, reputation as an expert (low cost but relies on users caring about perception)

**Personal utility**: "Quantified self" experiences, tracking progress, training personalized AI (no network effects needed)

**Altruism**: Community building, helping others make decisions, increasing fairness (potential for honest feedback)

**Intrinsic motivation**: Internal fulfillment from expressing themselves (no network effects needed)

### Align perceived and actual user value

If the benefit isn't clear and specific, users may not understand why they should give feedback. Ideally, users will understand the value of their feedback and will see it manifest in the product in a recognizable way.

### Connect feedback to user experience changes

Simply acknowledging that you received a user's feedback can build trust, but ideally the product will also let them know what the system will do next, or how their input will influence the AI.

Approaches for describing feedback timing and impact:

1. "Thanks for your feedback"
2. "Thanks! Your feedback helps us improve future run recommendations"
3. "Thanks! We'll improve your future run recommendations"
4. "Thanks! Your next run recommendation won't include hills"
5. "Thanks. We've updated your recommendations. Take a look"

### Set expectations for AI improvements

For many systems, even with user feedback, much of the AI output is likely to be the same as it was before. As a user provides more and more feedback, each piece will likely have less of an effect on the AI model.

The reality of these delays means you need to set clear expectations for when people should expect improvements to the model's performance.

### Key concept

When thinking about opportunities to ask for user feedback, think about how and when it will improve their experience with the AI. Ask yourself:

1. Do all of your user groups benefit from this feedback?
2. How might the user's level of control over the AI influence their willingness to provide feedback?
3. How will the AI change based on this feedback?
4. When will the AI change based on this feedback?

## ➂ Balance control & automation

For AI-driven products, there's an essential balance between automation and user control. Your product won't be perfect for every user, every time, so allow users to adapt the output to their needs, edit it, or turn it off.

### Understand when people want to maintain control

There are predictable situations when people prefer to remain in control:

**People enjoy the task**: Not every task is a chore

**People feel personally responsible for the outcome**: For most small favors or personal exchanges

**The stakes of the situation are high**: Physical, emotional, or financial stakes

**Personal preferences are hard to communicate**: When people have a creative vision

### Understand when people will give up control

There are plenty of times when people feel perfectly fine giving up control:

**When they are unable to do a task**: Often people would do something if they knew how or had time

**When a task is unpleasant or unsafe**: Most people would prefer to give up control to avoid tasks that require significant effort or risk

### Allow for opting out

When first introducing your AI, consider allowing users to test it out or turn it off. Once you've clearly explained the benefits, respect their decision not to use the feature.

### Provide editability

A user's preferences may change over time, so consider how you'll give them control over what preferences they communicate to your ML model, and give them the ability to adjust it.

### Key concept

Checklist before setting up feedback and control mechanisms:

1. Can your AI accommodate a wide range of user abilities and preferences?
2. Does your AI deal with highly-sensitive domains?
3. Will your AI take a long time to get to the target level of accuracy?
4. Is your AI used in high-stakes situations?
5. Are there likely changes in the user's needs that would require them to "reset" the model?

## Summary

When building your AI-powered feature or product, feedback and user control are critical to developing communication and trust between your user and the system, and for developing a product that fulfills your users' needs consistently over time.

---

_People + AI Guidebook by People + AI Research team is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. Based on a work at pair.withgoogle.com._
