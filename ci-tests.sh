#!/bin/sh
yarn run coverage > test-result.txt &
# Need this ugly code, because ng test gets stuck after completion. Halting the whole script. Unable to find fix.
while [ 1 ]
do
    test_finished=$(grep "TOTAL" test-result.txt)
    if [ -n "$test_finished" ]; then
        break
    else
        echo "checking test progress ..."
        sleep 5
    fi
done

echo "tests finished, checking result"
tests_failed=$(grep -i "fail" test-result.txt)
if [ -n "$tests_failed" ]; then
    echo "some tests failed"
    cat test-result.txt
    exit 1
else
    echo "all tests passed !"
fi

coverage=$(grep "Statements" test-result.txt | grep -o "[0-9]*%")
if [ "$coverage" != "100%" ]; then
    echo "Coverage check failed, check report for details"
    cat test-result.txt
    exit 2
fi

coverage=$(grep "Branches" test-result.txt | grep -o "[0-9]*%")
if [ "$coverage" != "100%" ]; then
    echo "Coverage check failed, check report for details"
    cat test-result.txt
    exit 3
fi

coverage=$(grep "Functions" test-result.txt | grep -o "[0-9]*%")
if [ "$coverage" != "100%" ]; then
    echo "Coverage check failed, check report for details"
    cat test-result.txt
    exit 4
fi

coverage=$(grep "Lines" test-result.txt | grep -o "[0-9]*%")
if [ "$coverage" != "100%" ]; then
    echo "Coverage check failed, check report for details"
    cat test-result.txt
    exit 5
fi

echo "all coverage checks passed !!"

yarn run doc-test