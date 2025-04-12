# StudyBox
Have you ever been studying and you just can't seem to focus? Studybox looks to remedy that by providing you some tools to make your study sessions feel more productive.


# HOW TO RUN
Clone from the main branch.  
Go to Chrome extension, enable developer mode.  
Click Load unpacked
Browse to the folder where you cloned the repository (the folder containing the manifest.json) and select it.
The extension should now be loaded and visible in your list of extensions. Try to run it with websites now!

## Inspiration
The inspiration came from the bionic reading font, which forces the first half of a word to be bold. This has been shown to help people with ADHD focus because our brain autofill the second half of the word when we see the first half. We branched out from implementing this feature and added more functionalities that help people concentrate on readings and enhance the learning experience.

## What it does
Studybox is a toolbox Google Chrome extension that helps convert normal text to the bionic reading font, highlight text that also moves along, as well as provide basic GenAI tools that are meant to help with studying habits. These GenAI tools help with summarizing texts and creating practice problem sets. 

## How we built it
The application was built with the very basics, with JavaScript, HTML, CSS as our frontend, and Node.JS and Google Gemini as our backend.

## Challenges we ran into
A challenge that we ran into was dealing with PDFs vs. actual web pages and understanding how Google Chrome extensions works, since it's our first time working with it. Merging all four features so they can run one at each time without conflicting each other also took some time to work with.




