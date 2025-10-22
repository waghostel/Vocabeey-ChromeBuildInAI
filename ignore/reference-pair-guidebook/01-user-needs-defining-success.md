# User Needs + Defining Success

> **Source**: [People + AI Guidebook](https://pair.withgoogle.com/chapter/user-needs/)  
> **License**: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License  
> **Copyright**: People + AI Research team at Google

## Overview

Even the best AI will fail if it doesn't provide unique value to users.

This chapter covers:

- Which user problems is AI uniquely positioned to solve?
- How can we augment human capabilities in addition to automating tasks?
- How can we ensure our reward function optimizes AI for the right thing?

## What's new when working with AI

When building any product in a human-centered way, the most important decisions you'll make are: Who are your users? What are their values? Which problem should you solve for them? How will you solve that problem? How will you know when the experience is "done"?

In this chapter, we'll help you understand which user problems are good candidates for AI and how to define success. Key considerations:

**➀ Find the intersection of user needs & AI strengths.** Solve a real problem in ways in which AI adds unique value.

**➁ Assess automation vs. augmentation.** Automate tasks that are difficult, unpleasant, or where there's a need for scale; and ideally ones where people who currently do it can agree on the "correct" way to do it. Augment tasks that people enjoy doing, that carry social capital, or where people don't agree on the "correct" way to do it.

**➂ Design & evaluate the reward function.** The "reward function" is how an AI defines successes and failures. Deliberately design this function with a cross-functional team, optimizing for long-term user benefits by imagining the downstream effects of your product. Share this function with users when possible.

## ➀ Find the intersection of user needs & AI strengths

Like any human-centered design process, the time you spend identifying the right problem to solve is some of the most important in the entire effort. Talking to people, looking through data, and observing behaviors can shift your thinking from technology-first to people-first.

The first step is to identify real problems that people need help with. There are many ways to discover these problems and existing resources online to help you get started. We recommend looking through IDEO's Design Kit methods section for examples of how to find problems and corresponding user needs.

Throughout the Guidebook we use an example app, RUN. For that app, user needs might be:

- The user wants to get more variety in their runs so they don't get bored and quit running.
- The user wants to track their daily runs so that they can get ready for a 10k in six months.
- The user would like to meet other runners at their skill level so they can stay motivated to keep running.

You should always build and use AI in responsible ways. When deciding on which problem to solve, take a look at the Google AI Principles, and Responsible AI Practices for practical steps, to ensure you're building with the greater good in mind. For starters, make sure to get input from a diverse set of users early on in your product development process.

### Map existing workflows

Mapping the existing workflow for accomplishing a task can be a great way to find opportunities for AI to improve the experience. As you walk through how people currently complete a process, you'll better understand the necessary steps and identify aspects that could be automated or augmented.

### Decide if AI adds unique value

Once you identify the aspect you want to improve, you'll need to determine which of the possible solutions require AI, which are meaningfully enhanced by AI, and which solutions don't benefit from AI or are even degraded by it.

It's important to question whether adding AI to your product will improve it. Often a rule or heuristic-based solution will work just as well, if not better, than an AI version.

#### When AI is probably better

- **Recommending different content to different users.** Such as providing personalized suggestions for movies to watch.
- **Prediction of future events.** For example, showing flight prices for a trip to Denver in late November.
- **Personalization improves the user experience.** Personalizing automated home thermostats makes homes more comfortable and the thermostats more efficient over time.
- **Natural language understanding.** Dictation software requires AI to function well for different languages and speech styles.
- **Recognition of an entire class of entities.** It's not possible to program every single face into a photo tagging app — it uses AI to recognize two photos as the same person.
- **Detection of low occurrence events that change over time.** Credit card fraud is constantly evolving and happens infrequently to individuals, but frequently across a large group.
- **An agent or bot experience for a particular domain.** Booking a hotel follows a similar pattern for a large number of users and can be automated to expedite the process.
- **Showing dynamic content is more efficient than a predictable interface.** AI-generated suggestions from a streaming service surface new content that would be nearly impossible for a user to find otherwise.

#### When AI is probably not better

- **Maintaining predictability.** Sometimes the most valuable part of the core experience is its predictability, regardless of context or additional user input.
- **Providing static or limited information.** For example, a credit card entry form is simple, standard, and doesn't have highly varied information requirements for different users.
- **Minimizing costly errors.** If the cost of errors is very high and outweighs the benefits of a small increase in success rate.
- **Complete transparency.** If users, customers, or developers need to understand precisely everything that happens in the code, like with Open Source Software.
- **Optimizing for high speed and low cost.** If speed of development and getting to market first is more important than anything else to the business.
- **Automating high-value tasks.** If people explicitly tell you they don't want a task automated or augmented with AI, that's a good task not to try to disrupt.

#### Key concept

Instead of asking "Can we use AI to **\_\_\_**?", start exploring human-centered AI solutions by asking:

- How might we solve \***\*\_\*\*** ?
- Can AI solve this problem in a unique way?

## ➁ Assess automation vs. augmentation

When you've found the problem you want to solve and have decided that using AI is the right approach, you'll then evaluate the different ways AI can solve the problem and help users accomplish their goals. One large consideration is if you should use AI to automate a task or to augment a person's ability to do that task themselves.

### When to automate

Automation is typically preferred when it allows people to avoid undesirable tasks entirely or when the time, money, or effort investment isn't worth it to them. Successful automation is often measured by the following:

- Increased efficiency
- Improved human safety
- Reduction of tedious tasks
- Enabling new experiences that weren't possible without automation

Consider automating experiences when:

#### People lack the knowledge or ability to do the task

There are many times when people would do something if they knew how, but they don't so they can't. Or they technically know how, but a machine is much better suited to the task.

#### Tasks are boring, repetitive, awkward, or dangerous

There's little value in attempting to edit a document you wrote without using spell-check. It's unwise to check for a gas leak in a building using your own nose when you could use a sensor to detect the leak.

Even when you choose to automate a task, there should almost always be an option for human oversight — sometimes called "human-in-the-loop" — and intervention if necessary.

### When to augment

When building AI-powered products, it's tempting to assume that the best thing you can do for your users is automate tasks they currently have to do manually. However, there are plenty of situations where people typically prefer for AI to augment their existing abilities and give them "superpowers" instead of automating a task away entirely.

Successful augmentation is often measured by the following:

- Increased user enjoyment of a task
- Higher levels of user control over automation
- Greater user responsibility and fulfillment
- Increased ability for the user to scale their efforts
- Increased creativity

Consider augmenting people's existing abilities when:

#### People enjoy the task

Not every task is a chore. If you enjoy writing music, you probably wouldn't want an AI to write entire pieces for you.

#### Personal responsibility for the outcome is required or important

People exchange small favors all the time. Part of doing a favor for someone is the social capital you gain by giving up your time and energy.

#### The stakes of the situation are high

People often want to, or have to, remain in control when the stakes are high for their role; for example pilots, doctors, or police officers.

#### Specific preferences are hard to communicate

Sometimes people have a vision for how they want something done: a room decorated, a party planned, or a product designed. They can see it in their mind's eye but can't seem to do it justice in words.

#### Key concept

Below are some example research questions you can ask to learn about how your users think about automation and augmentation:

- If you were helping to train a new coworker for a similar role, what would be the most important tasks you would teach them first?
- Tell me more about that action you just took, about how often do you do that?
- If you had a human assistant to work with on this task, what, if any duties would you give them to carry out?

## ➂ Design & evaluate the reward function

Any AI model you build or incorporate into your product is guided by a reward function, also called an "objective function", or "loss function." This is a mathematical formula, or set of formulas, that the AI model uses to determine "right" vs. "wrong" predictions.

When designing your reward function, you must make a few key decisions that will dramatically affect the final experience for your users. Remember that designing your reward function should be a collaborative process across disciplines.

### Weigh false positives & negatives

Many AI models predict whether or not a given object or entity belongs to a certain category. These kind of models are called "binary classifiers".

When binary classifiers make predictions, there are four possible outcomes:

- **True positives.** When the model correctly predicts a positive outcome.
- **True negatives.** When the model correctly predicts a negative outcome.
- **False positives.** When the model incorrectly predicts a positive outcome.
- **False negatives.** When the model incorrectly predicts a negative outcome.

Weighing the cost of false positives and false negatives is a critical decision that will shape your users' experiences.

#### Consider precision & recall tradeoffs

**Precision** refers to the proportion of true positives correctly categorized out of all the true and false positives. The higher the precision, the more confident you can be that any model output is correct. However, the tradeoff is that you will increase the number of false negatives.

**Recall** refers to the proportion of true positives correctly categorized out of all the true positives and false negatives. The higher the recall, the more confident you can be that all the relevant results are included somewhere in the output. However, the tradeoff is that you will increase the number of false positives.

#### Evaluate the reward function outcomes

Here are a few considerations when evaluating your reward function:

**Assess inclusivity**: Make sure your reward function produces a great experience for all of your users. Being inclusive means taking the time to understand who is using your product and making sure the user experience is equitable for people from a variety of backgrounds and perspectives.

**Monitor over time**: Consider the implications of your chosen reward function over time. Imagine the best individual and collective user experience on their 100th or 1,000th day using your product as well as the first.

**Imagine potential pitfalls**: Second-order effects are the consequences of the consequences of a certain action. One useful question to ask is, "What would happen to our users/their friends & family/greater society if the reward function were perfectly optimized?"

**Account for negative impact**: As AI moves into higher stakes applications and use-cases, it becomes even more important to plan for and monitor negative impacts of your product's decisions.

#### Key concept

Everyone on your team should feel aligned on what both success and failure look like for your feature, and how to alert the team if something goes wrong. Here's an example framework for this:

If { specific success metric } for { your team's AI-driven feature } { drops below/goes above } { meaningful threshold } we will { take a specific action }.

## Summary

Aligning your product with user needs is step one in any successful AI product. Once you've found a need, you should evaluate whether using AI will uniquely address the need. From there, consider whether some parts of the experience should be automated or augmented. Lastly, design your reward function to create a great user experience for all your users over the long run.

---

_People + AI Guidebook by People + AI Research team is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. Based on a work at pair.withgoogle.com._
