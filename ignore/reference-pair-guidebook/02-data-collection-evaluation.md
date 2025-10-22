# Data Collection + Evaluation

> **Source**: [People + AI Guidebook](https://pair.withgoogle.com/chapter/data-collection/)  
> **License**: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License  
> **Copyright**: People + AI Research team at Google

## Overview

Sourcing and evaluating the data used to train AI involve important considerations. This chapter covers the following questions:

- Does our training dataset have the features and breadth to ensure our AI meets our users' needs?
- Should we use an existing training dataset or develop our own?
- How can we ensure that the data quality is high?
- How can we work with labelers to prevent errors and bias in datasets when generating labels?
- Are we treating data workers fairly?

## What's new when working with AI

In order to make predictions, AI-driven products must teach their underlying machine learning model to recognize patterns and correlations in data. This data is called training data, and can be collections of images, videos, text, audio and more.

The training data you source or collect, and how those data are labeled, directly determines the output of your system — and the quality of the user experience. Key considerations:

**➀ Plan to gather high-quality data from the start.** Data is critical to AI, but more time and resources are often invested in model development than data quality.

**➁ Translate user needs into data needs.** Determine the type of data needed to train your model. You'll need to consider predictive power, relevance, fairness, privacy, and security.

**➂ Source your data responsibly.** Whether using pre-labeled data or collecting your own, it's critical to evaluate your data and their collection method.

**➃ Prepare and document your data.** Prepare your dataset for AI, and document its contents and the decisions that you made while gathering and processing the data.

**➄ Design for labelers & labeling.** For supervised learning, having accurate data labels is crucial to getting useful output from your model.

**➅ Tune your model.** Once your model is running, interpret the AI output to ensure it's aligned with product goals and user needs.

## ➀ Plan to gather high-quality data from the start

Data is critical to AI, but the time and resources invested in model development and performance often outweigh those spent on data quality.

This can lead to significant downstream effects throughout the development pipeline, which we call "data cascades". Some data cascades may be hard to diagnose, and you may not see their impact until users report a poor experience.

It's best to plan to use high-quality data from the beginning. High-quality data can be defined as:

- Accurately representing a real-world phenomenon or entity
- Collected, stored, and used responsibly
- Reproducible
- Maintainable over time
- Reusable across relevant applications
- Having empirical and explanatory power

## ➁ Translate user needs into data needs

Datasets that can be used to train AI models contain examples, which contain one or more features, and possibly labels.

The scope of features, the quality of the labels, and representativeness of the examples in your training dataset are all factors that affect the quality of your AI system.

### Create a dataset specification

Just as you would create a product specification before starting work on a new feature or product, consider writing a document to specify your data needs. Use the problem statement that you defined from the user needs to define the dataset that you will need.

### Get the data

Once you've defined the data requirements, you'll start gathering the data. A good place to start is to determine if there are any existing datasets that you can reuse.

If you decide to acquire an existing dataset, make sure that you have information about:

- How was the data collected?
- Which transformations were applied to it?
- Do you need to augment it with additional data sources?
- Were any trade-offs and assumptions made when creating it?
- What are the data compliance standards and licensing information?

#### Identify the data that you need vs. the data that you have

Use the following questions to assess the data that you have:

- Does any of the data need to be treated differently? (PII, Protected Characteristics)
- What benefit are you providing to the user by using this data?
- Can you store and use the data securely?
- How long will you keep the data?
- How much data do you actually need to label?
- Is the data representative of your users?

#### Balance underfitting & overfitting

To build products to work in one context, use datasets that are expected to reliably reflect that context. If your training data isn't properly suited to the context, you also increase the risk of overfitting or underfitting your training set.

**Overfitting** means the ML model is tailored too specifically to the training data. If an ML model has overfit the training data, it can make great predictions on the training data but performs worse on the test set or when given new data.

**Underfitting** is where a model hasn't properly captured the complexity of the relationships among the training dataset features and therefore can't make good predictions with training data or with new data.

#### Commit to fairness

At every stage of development, human bias can be introduced into the ML model. Data is collected in the real world, from humans, and reflects their personal experiences and biases — and these patterns can be implicitly identified and amplified by the ML model.

Here are some examples of how ML systems can fail users:

- **Representational harm**, when a system amplifies or reflects negative stereotypes about particular groups.
- **Opportunity denial**, when systems make predictions and decisions that have real-life consequences and lasting impacts.
- **Disproportionate product failure**, when a product doesn't work or gives skewed outputs more frequently for certain groups of users.
- **Harm by disadvantage**, when a system infers disadvantageous associations between certain demographic characteristics and user behaviors or interests.

Steps to mitigate problematic biases:

**Use data that applies to different groups of users**: Your training data should reflect the diversity and cultural context of the people who will use it. Use tools like Facets and WIT to explore your dataset and better understand its biases.

**Consider bias in the data collection and evaluation process**: There is no such thing as truly neutral data. Even in a simple image, the equipment and lighting used shapes the outcome.

#### Manage privacy & security

As with any product, protecting user privacy and security is essential. Here are some suggestions:

- Review the data for PII and Protected Characteristics
- Consult with a lawyer before collecting or using such data
- Don't assume basic data policies are enough to protect personal privacy
- Set up infrastructure, training and guidance programs for privacy protection
- Take extra steps to protect privacy (e.g., anonymize names)

Important questions to discuss with privacy and security experts:

**What limits exist around user consent for data use?** When collecting data, a best practice is to give users as much control as possible over what data the system can use and how data can be used.

**Is there a risk of inadvertently revealing user data?** For example, though an individual's health data might be private and secure, if an AI assistant reminds the user to take medication through a home smart speaker, this could partially reveal private medical data to others who might be in the room.

## ➂ Source your data responsibly

### Use existing datasets

It may not be possible to build your dataset from scratch. You may need to use existing data from sources such as Google Cloud AutoML, Google Dataset Search, Google AI datasets, or Kaggle.

Before using an existing dataset, take the time to thoroughly explore it using tools like Facets to better understand any gaps or biases. Real data is often messy, so you should expect to spend a fair amount of time cleaning it up.

### Build your own dataset

When creating your own dataset, it's wise to start by observing someone who is an expert in the domain your product aims to serve. You'll also want to research available datasets that seem relevant and evaluate the signals available in those datasets.

Once you've gathered potential sources for your dataset, spend some time getting to know your data:

1. Identify your data source(s)
2. Review how often your data source(s) are refreshed
3. Inspect the features' possible values, units, and data types
4. Identify any outliers, and investigate whether they're actual outliers or due to errors

### Collect live data from users

Once your model has been trained and your product is being used in the real world, you can start collecting data in your product to continually improve your ML model. Data can be collected implicitly in the background of user activity within your app or explicitly when you ask users directly.

### Capture the real world

Make sure that your input data is as similar as possible to real-world data to avoid model failure in production. Instead of striving for a very "clean" dataset, allow some 'noise' into your training dataset because you'll have plenty of it in the real world.

### Consider formatting

Real data can be messy! A "zero" value could be an actual measured "0," or an indicator for a missing measurement. While a human can spot the meaning just by looking at the data, an ML model learns better from data that is consistently formatted.

### Avoid compounding errors from other ML models

If you're using the output of another ML system as an input feature to train your model, keep in mind that this is a risky data source. Errors associated with this feature will be compounded with your system's overall error.

### Protect personally identifiable information

No matter what data you're using, it's possible that it could contain personally identifiable information. Some approaches to anonymizing data include aggregation and redaction.

### Prepare a data maintenance plan

If you want to create a dataset, consider whether you can maintain it. Focus on these tasks:

- **Preventive maintenance**: Prevent problems before they occur
- **Adaptive maintenance**: Preserve the dataset while the real world changes
- **Corrective maintenance**: Fix errors

## ➃ Prepare and document your data

### Split your dataset into training and test sets

You'll need to split the data into training and test sets. The model is trained to learn from the training data, and then evaluated with the test data. A typical split of your dataset could result in: 60% for training, and 40% for testing.

### Analyze and prepare your data

An important step in all model training pipelines is handling "dirty" or inconsistent data. Examples of operations performed to clean data include:

- Extracting structure
- Dealing with missing values
- Removing duplicates
- Handling incorrect data
- Correcting values to fall within certain ranges
- Adjusting values to map to existing values in external data sources

### Document your data

Dataset documentation can be just as important as code documentation. Data Cards are a form of documentation for datasets, and include information that can help answer questions about the data:

- What does it represent?
- What does it look like?
- Where does it come from?
- How was it prepared?
- Can it be used for a specific use case?
- How should it be used responsibly?

## ➄ Design for labelers & labeling

For supervised learning, accurate data labels are a crucial ingredient for achieving relevant ML output. Labels can be added through automated processes or by people known as labelers.

### Ensure labeler pool diversity

Think about the perspectives and potential biases of the people in your pool, how to balance these with diversity, and how their points of view could impact the quality of the labels.

Questions to ask when evaluating your labeler pool:

- Are your annotators similar to your end users?
- Are there cultural differences between labelers and users that could impact data quality?
- Do labelers know what to do?

### Investigate labeler context and incentives

Think through the labeler experience, and how and why they are performing this task. Incentives that focus on volume rather than quality can lead to bias in your dataset.

### Design tools for labeling

Tools for labeling can range from in-product prompts to specialized software. Recommendations include:

- Use multiple shortcuts to optimize key flows
- Provide easy access to labels
- Let labelers change their minds
- Auto-detect and display errors
- Review third-party tool capabilities and limitations
- Explain criteria for acceptance
- Allow labelers to mark instances as 'unsure' or skip them
- Value labeler disagreements

When compiling instructions for labeler tasks:

- Provide examples for the task to illustrate expectations
- Give step-by-step task instructions
- Break instructions down into manageable chunks
- Strike the right balance for task instruction length

## ➅ Tune your model

Once your model has been trained with your training data, evaluate the output to assess whether it's addressing your target user need according to the success metrics you defined.

To evaluate your model:

- Use tools like the What-If tool and the Language Interpretability Tool (LIT)
- Test, test, test on an ongoing basis
- Build appropriate and thoughtful mechanisms for user feedback
- Build custom dashboards and data visualizations to monitor user experience
- Check for secondary effects that you may not have anticipated
- Tie model changes to a clear metric of the subjective user experience

Consider the following when troubleshooting:

- Low data quality, or not enough high-quality data
- Unintended consequences
- Parts of the project which are particularly difficult for users to understand

## Summary

Data is the bedrock of any ML system. Having responsibly sourced data, from a relevant context, checked for problematic bias will help you build better systems and therefore more effectively address user needs.

---

_People + AI Guidebook by People + AI Research team is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. Based on a work at pair.withgoogle.com._
