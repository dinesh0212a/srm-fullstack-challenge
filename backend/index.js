const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Graph Processing Logic
function processGraph(data) {
    const invalidEntries = [];
    
    const formattedEdges = [];
    
    // 1. Sanitize and Validate Data
    data.forEach(item => {
        if (typeof item !== 'string') {
            invalidEntries.push(item);
            return;
        }
        let trimmed = item.trim();
        const isValidFormat = /^[A-Z]->[A-Z]$/.test(trimmed);
        
        if (isValidFormat) {
            const isSelfLoop = trimmed[0] === trimmed[3];
            if (isSelfLoop) {
                invalidEntries.push(item);
            } else {
                formattedEdges.push(trimmed);
            }
        } else {
            invalidEntries.push(item);
        }
    });

    const seenEdges = new Set();
    const duplicateEdgesSet = new Set();
    const keptEdges = [];
    const childHasParent = new Set();

    // 2. Handle duplicates and multi-parents
    formattedEdges.forEach(edge => {
        if (seenEdges.has(edge)) {
            duplicateEdgesSet.add(edge);
            return;
        }
        seenEdges.add(edge);
        
        const [parent, child] = edge.split('->');
        if (!childHasParent.has(child)) {
            childHasParent.add(child);
            keptEdges.push(edge);
        }
        // If child already has a parent, the edge is silently discarded per rules
    });
    
    const duplicateEdges = Array.from(duplicateEdgesSet);

    // 3. Build Adjacency and In-Degrees
    const parentToChildren = new Map();
    const nodes = new Set();
    const inDegree = new Map();
    
    keptEdges.forEach(edge => {
        const [parent, child] = edge.split('->');
        nodes.add(parent);
        nodes.add(child);
        
        if (!parentToChildren.has(parent)) {
            parentToChildren.set(parent, []);
        }
        parentToChildren.get(parent).push(child);
        
        inDegree.set(child, (inDegree.get(child) || 0) + 1);
        if (!inDegree.has(parent)) inDegree.set(parent, 0);
    });

    // 4. Undirected Graph for Connected Components
    const adjUndirected = new Map();
    nodes.forEach(n => adjUndirected.set(n, []));
    keptEdges.forEach(edge => {
        const [u, v] = edge.split('->');
        adjUndirected.get(u).push(v);
        adjUndirected.get(v).push(u);
    });

    const visitedNodes = new Set();
    const components = [];
    
    nodes.forEach(n => {
        if (!visitedNodes.has(n)) {
            const comp = [];
            const q = [n];
            visitedNodes.add(n);
            while (q.length > 0) {
                const curr = q.shift();
                comp.push(curr);
                adjUndirected.get(curr).forEach(neighbor => {
                    if (!visitedNodes.has(neighbor)) {
                        visitedNodes.add(neighbor);
                        q.push(neighbor);
                    }
                });
            }
            components.push(comp);
        }
    });

    const hierarchies = [];
    let totalTrees = 0;
    let totalCycles = 0;
    let maxDepth = -1;
    let largestTreeRoot = null;

    const buildTree = (node) => {
        const children = parentToChildren.get(node) || [];
        const treeObj = {};
        let depth = 1;
        
        children.forEach(child => {
            const childResult = buildTree(child);
            treeObj[child] = childResult.tree;
            depth = Math.max(depth, 1 + childResult.depth);
        });
        
        return { tree: treeObj, depth };
    };

    // 5. Process Components
    components.forEach(comp => {
        const compRoots = comp.filter(n => inDegree.get(n) === 0);
        if (compRoots.length > 0) {
            // Tree Component
            const root = compRoots[0];
            const result = buildTree(root);
            hierarchies.push({
                root,
                tree: { [root]: result.tree },
                depth: result.depth
            });
            totalTrees++;
            
            if (result.depth > maxDepth) {
                maxDepth = result.depth;
                largestTreeRoot = root;
            } else if (result.depth === maxDepth) {
                if (largestTreeRoot === null || root < largestTreeRoot) {
                    largestTreeRoot = root;
                }
            }
        } else {
            // Cyclic Group Component
            comp.sort();
            const root = comp[0];
            hierarchies.push({
                root,
                tree: {},
                has_cycle: true
            });
            totalCycles++;
        }
    });

    return {
        hierarchies,
        invalidEntries,
        duplicateEdges,
        summary: {
            total_trees: totalTrees,
            total_cycles: totalCycles,
            largest_tree_root: largestTreeRoot || ""
        }
    };
}

// REST API Endpoint
app.post('/bfhl', (req, res) => {
    try {
        const { data } = req.body;
        
        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ error: "Malformed request. Please provide a 'data' array." });
        }

        const processedData = processGraph(data);

        // Required JSON response keys
        res.status(200).json({
            "user_id": "jalapativenkatasaidurgadineeshkumar_22052006", 
            "email_id": "vj7128@srmist.edu.in",
            "college_roll_number": "RA2311056010058",
            "hierarchies": processedData.hierarchies,
            "invalid_entries": processedData.invalidEntries,
            "duplicate_edges": processedData.duplicateEdges,
            "summary": processedData.summary
        });

    } catch (error) {
        console.error("API Processing Error:", error);
        res.status(500).json({ error: "Internal server error during graph processing." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 SRM Backend API is live on port ${PORT}`);
});