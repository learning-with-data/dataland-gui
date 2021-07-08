# Adding New Blocks

To add new blocks to the Dataland system, you need to follow these steps:

## 1. Adding the Block Component
First, define the new block component in JavaScript located at:
```
./src/lib/blockly/blocks
```
Here, each JavaScript file corresponds to one category of blocks, as you see in the block drawer in Dataland. 

To add a new block, you need to decide which category the new block belongs to, and add its definition to the relevant JavaScript file. 

Follow the same Blockly definition format, and define the block ID (in square brackets) and the initialization function.

At this point, the block is defined in the system, but you still cannot see it. To load and display the block in the block drawer, you need to add it to the toolbox. 

## 2. Adding the Block to Toolbox
To add your new block to the toolbox, go to:
```
./src/lib/blockly/toolbox
```
Here again, each JavaScript files corresponds to one category, and you need to edit the relevant JavaScript file. 

Inside the JavaScript file, add the html code for your new block. For each new block you will need to add, at minimum, the intended block type and the ID you just defined. In case the block takes inputs, you will need to define placeholder value for each field.

At this point, the block should be loaded and displayed in Dataland's toolbox under the intended category. It is, however, not functional yet.

## 3. Adding Functionality for Interpreter
For the block to be functional, you need to tell the Dataland interpreter what function to execute when it runs into the block. This is done by editing, again, the relevant JavaScript file located in:
```
./src/lib/primitives
```
At the top of the file, you will find a `constructor(runtime)` function with a bunch of arrow functions inside. This function maps each block to a corresponding JavaScript function in this format:
```
this.BLOCK_ID = () => this.CORRESPONDING_BLOCK_FUNCTION();
```
Add your block-function mapping, and define the corresponding block function after the constructor function. 

If your function uses any user input from open fields in the block, you can pass in the block as a variable, and access block inputs using `getBlockArg()`.

Data table and other system variables can be accessed through `this.runtime`.

At this point, you should have succesfully added a fully functional block to Dataland!

## Definition References
(TODO)
* Blockly block definition format
* Toolbox definition format
* Interpreter functions
* Backend data functions
