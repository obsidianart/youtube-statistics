youtube-statistics
==================

A small example of interaction with youtube player.
This code is a test and is not production ready (it could but he need more testing and automated testing).

The code audit user behaviours on YouTube player video on the assumption the videos are embed with the youtube "get embed code" button and, at the current state, only log play and stop event.

YouTube have almost no documentation on this scenario and while searching it seems a quite common problem.

For the final User:

1. Include statistics.min.js in your code
    
        <script src="//www.yourserver.com/lib/statistics.js"></script>

2. Initialize the library with your username as follow

        <script>
        //Loading the audit component
        window.trackYouTubeVideos("username");
        </script>