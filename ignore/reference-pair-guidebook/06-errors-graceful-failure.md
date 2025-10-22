# Errors and Graceful Failures

Source: https://pair.withgoogle.com/guidebook/chapters/errors-and-graceful-failures

## Overview

AI systems, like all products, are not immune to errors and failures. How we design for these moments significantly impacts the user experience. This section covers:

- What constitutes an "error" or "failure" in the context of AI products?
- What are the different types of errors users might encounter, including user, system, and alignment errors?
- How can we evaluate the severity and impact of different errors?
- What are the common sources of errors in AI systems?
- How can we provide users with effective paths forward when errors or failures occur?
- Why is it important to anticipate and prepare for emerging risks and potential misuse?

When building any product in a human-centered way, understanding and designing for inevitable errors and failures is crucial for building trust and ensuring a helpful user experience. By proactively addressing potential issues and providing clear guidance and recovery paths, we can prevent undue harm and help users successfully achieve their goals, even when things don't go as planned. This human-centered approach to error handling is essential for creating robust and reliable AI products.

## 1. Understand "errors" & "failure"

Understand errors and failures in AI products. Learn about the different types of errors, such as user errors, which are mistakes made by the user, system errors, which are flaws in the AI system, and alignment errors, which are mismatches between the system's assumptions and user expectations. Also, learn how to evaluate errors using a confusion matrix, a tool to visualize the performance of a classification model. Explore the consequences of errors, with an emphasis on the importance of considering real-world impacts.

## 2. Identify sources of error

Identify sources of errors in AI systems. Learn how errors can stem from various factors, including issues with training data, the data used to teach the AI, model performance, how well the AI performs its task, user input, the information provided by the user, and system interactions, how different parts of the system work together. Discover mitigations, strategies to reduce or prevent errors, for each type of error, which can help in creating more robust and user-friendly AI products.

## 3. Provide paths forward from failure

Provide paths forward when AI systems fail. Emphasize the importance of matching safety measures to the situation's stakes, the potential consequences of an error, and designing error recovery strategies across the product lifecycle, from design to maintenance. Cover proactive error guidance, designing the system to anticipate and prevent errors, using bi-directional feedback, two-way communication between the user and the system to resolve errors, and preparing for emerging risks, new types of errors that may appear as the system evolves.
