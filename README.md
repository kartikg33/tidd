<h1 align="center">Testable-Interface Driven Development (TIDD)</h1>

<pre class="mermaid" align="center">
block-beta
    columns 5
    test["Test Suite"] space ModuleA space ModuleB
    arrow1<["uses"]>(down) space arrow2<["uses"]>(down) space arrow3<["uses"]>(down) 
    block:module:5
        columns 1
        interface["Testable Interface (i.e. The Contract)"]
        impl["Concrete Implementation (i.e. The Code)"]
    end
</pre>



**TIDD** is a software development approach that unifies the best of *TDD* (Test-Driven Development) and *IDD* (Interface-Driven Development).  

The core principle is simple:

> **Interfaces should be designed with testability as a primary concern, and tests should validate the contracts defined by those interfaces, not their internal implementations.**

To do this, every **unit of code** (a module, component, library, etc...) must consist of a **testable interface** that serves as a **contract between external code and your code**. Additionally, test suites and external code should be built against those **well-defined versioned contracts** instead of against **brittle code implementations**.

#### Quick Links
- [📜 **The TIDD Manifesto** (principles + philosophy)](./manifesto.md)
- [🧪 **Examples** (coming soon)](./examples/)