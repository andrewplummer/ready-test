# ReadyTest

Because JS unit testing shouldn't be complicated.

## Install

```
npm install ready-test
```

## Browser

To get up and running in the browser, link the included CSS/JS:

```html
<html>
  <head>
    <link rel="stylesheet" href="node_modules/ready-test/ready-test.css">
  </head>
  <body>
    <script src="node_modules/ready-test/ready-test.js"></script>
  </body>
</html>
```

Then link your source files and tests:

```html
<html>
  <head>
    <link rel="stylesheet" href="node_modules/ready-test/ready-test.css">
  </head>
  <body>
    <script src="node_modules/ready-test/ready-test.js"></script>
    <script src="src/user.js"></script>
    <script src="test/userTest.js"></script>
  </body>
</html>
```

## Node

To run in node, simply run the shell command provided:

```
./node_modules/ready-test/bin/readytest
```

It will find and run any tests like `test/userTest.js`, `test/tests/user.js`, etc.
You can also add it to your `package.json` file to run with npm test:

```json
{
  "scripts": {
    "test": "readytest"
  }
}
```

## Docs

#### [http://andrewplummer.github.io/ready-test/](http://andrewplummer.github.io/ready-test/)
